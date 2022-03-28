import { Auth, API as AmplifyAPI } from "aws-amplify";
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { 
  S3Client, GetObjectCommand, HeadObjectCommand, 
  ListObjectsV2Command, RestoreObjectCommand 
} = require("@aws-sdk/client-s3");
const path = require("path");
const zlib = require('zlib')

// TODO:  Move this to config
const region = 'us-east-2';
var cache = {};

async function getS3Client() {
  if (cache.hasOwnProperty['s3Client']) {
    return cache['s3Client'];
  }

  const credentials = await Auth.currentCredentials();
  const clientConfig = {
    region: region,
    credentials: credentials
  };
  cache['s3Client'] = new S3Client(clientConfig);
  return cache['s3Client'];
}

// TODO: Get Amplify API name from aws-exports.js
const amplifyApiName = 'apiawsigv';

async function getGlacierStatus(bucket, fileKey) {
  // Front end - Not working currently as AWS client SDK call returns undefined for Restore key in response object
  // const headResponse = await headObject(bucket, fileKey);
  // const restoreString = headResponse['Restore'];

  //Back end - Use this for now until front end is working properly
  const headResponse = await AmplifyAPI.get(amplifyApiName, `/api/headObject?bucket=${bucket}&fileKey=${fileKey}`);
  const restoreString = headResponse['result']['Restore'];
  console.log(restoreString);

  var restoreInProgress = undefined; 
  var expiryDate = undefined;
  if (restoreString) {
    // Example header when restore is requested but not done yet
    // Restore: "ongoing-request="true"""
    // Example header value when restored (storageClass is still GLACIER)
    // Restore: "ongoing-request="false", expiry-date="Wed, 22 Dec 2021 00:00:00 GMT""
    // Too bad it's not JSON!

    var key = 'ongoing-request=';
    const val = restoreString.slice(restoreString.indexOf(key) + key.length).split(',')[0];
    restoreInProgress = val.toLowerCase().includes('true') ? true : false;

    key = 'expiry-date=';
    if (restoreString.indexOf(key) >= 0) {
      expiryDate = restoreString.slice(restoreString.indexOf(key) + key.length).replaceAll('"', '');
    }
  }
  return {
    restoreInProgress: restoreInProgress,
    expiryDate: expiryDate
  }
}

// Return file objects with key and storage class
async function getFileKeys(bucket, keyPrefix) {
  const s3Client = await getS3Client();
  const params = {Bucket: bucket, Prefix: keyPrefix};
  const command = new ListObjectsV2Command(params);
  const responseObject = await s3Client.send(command);
  console.log(responseObject);
  if (responseObject["Contents"] === undefined) {
    throw new Error(`S3 location not found for bucket ${bucket} and key ${keyPrefix}`);
  }
  let fileKeys = [];
  for (let fileObj of responseObject["Contents"]) {
      let fileKey = fileObj["Key"];
      if (isBam(fileKey) || isVCF(fileKey)) {
        let fileResult = {
          bucket: bucket,
          fileKey: fileKey, 
          storageClass: fileObj['StorageClass'],
          fileStatus: 'AVAILABLE'
        };
        if (fileResult.storageClass !== "STANDARD") {
          console.log(`Checking for details for ${fileKey}...`);
          var glacierStatus = await getGlacierStatus(bucket, fileKey);
          console.log(glacierStatus);
          if (glacierStatus.restoreInProgress) {
            fileResult.fileStatus = 'RESTORE REQUESTED';
          } else if (glacierStatus.expiryDate === undefined) {
            fileResult.fileStatus = 'NEEDS RESTORATION';
          };
        };
        console.log(fileResult);
        fileKeys.push(fileResult);
      }
  }
  return fileKeys;
}

/**
* Compress string and encode in a url safe form
*/
function compressString(str) {
  const deflated = zlib.deflateRawSync(str).toString('base64');
  return deflated.replace(/\+/g, '.').replace(/\//g, '_').replace(/=/g, '-');   // URL safe
}

function getIGVSessionTemplate() {
  return {
    "version": "2.10.4",
    "showSampleNames": false,
    "reference": {
      "id": "hg38",
      "name": "Human (GRCh38/hg38)",
      "fastaURL": "https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg38/hg38.fa",
      "indexURL": "https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg38/hg38.fa.fai",
      "cytobandURL": "https://s3.amazonaws.com/igv.org.genomes/hg38/annotations/cytoBandIdeo.txt.gz",
      "aliasURL": "https://s3.amazonaws.com/igv.org.genomes/hg38/hg38_alias.tab",
      "chromosomeOrder": "chr1, chr2, chr3, chr4, chr5, chr6, chr7, chr8, chr9, chr10, chr11, chr12, chr13, chr14, chr15, chr16, chr17, chr18, chr19, chr20, chr21, chr22, chrX, chrY"
    },
    "locus": "all",
    "tracks": [
      {
        "type": "sequence",
        "order": -9007199254740991
      },
      {
        "name": "Refseq Genes",
        "format": "refgene",
        "url": "https://s3.amazonaws.com/igv.org.genomes/hg38/ncbiRefSeq.sorted.txt.gz",
        "indexURL": "https://s3.amazonaws.com/igv.org.genomes/hg38/ncbiRefSeq.sorted.txt.gz.tbi",
        "visibilityWindow": -1,
        "removable": false,
        "order": 1000000,
        "infoURL": "https://www.ncbi.nlm.nih.gov/gene/?term=$$",
        "type": "annotation"
      }
    ]
  }
}

const signedUrlExpireSeconds = 60 * 60 * 24 * 7  // 7 days

async function getPresignedS3URL(bucket, fileKey, expirationInSeconds) {
  const s3Client = await getS3Client();
  const params = {Bucket: bucket, Key: fileKey};
  const command = new GetObjectCommand(params);
  const response = await getSignedUrl(s3Client, command, { expiresIn: expirationInSeconds });
  return response;
}

async function requestFileRestore(bucket, fileKey, daysToRestore=7, tier='Bulk') {
  const s3Client = await getS3Client();
  const params = {
    Bucket: bucket, 
    Key: fileKey, 
    RestoreRequest: { 
      Days: daysToRestore,
      GlacierJobParameters: {
        Tier: tier
      }
    }
  };
  const command = new RestoreObjectCommand(params);
  const response = await s3Client.send(command);
  return response;
}

async function headObject(bucket, fileKey) {
  const s3Client = await getS3Client();
  const params = {
    Bucket: bucket, 
    Key: fileKey
  };
  const command = new HeadObjectCommand(params);
  const response = await s3Client.send(command);
  return response;
}

// Is the given file name (S3 key) a bam file?
function isBam(fileKey) {
  return fileKey.toLowerCase().endsWith('.bam')
}

// Is the given file name (S3 key) a VCF file?
function isVCF(fileKey) {
  return fileKey.toLowerCase().endsWith('.vcf.gz') || fileKey.toLowerCase().endsWith('.vcf') 
}

// Return the file type given an S3 file key.
function getFileType(fileKey) {
  if (isBam(fileKey)) {
    return 'bam';
  } else if (isVCF(fileKey)) {
    return 'vcf';
  } else {
    throw new Error('Unknown file type for ' + fileKey);
  }
}

// Return the index suffix for the given file type.
function getIndexSuffix(fileType) {
  if (fileType === 'bam') {
    return '.bai';
  }
  else if (fileType === 'vcf') {
    return '.tbi';
  }
  else {
    throw new Error('Unknown index suffix for file type ' + fileType);
  }
}

function getBamTrack(trackName, fileS3Key, indexFileS3Key) {
  return {
      "url": fileS3Key,
      "name": trackName,
      "indexURL": indexFileS3Key,
      "indexFilename": "",
      "format": "bam",
      "type": "alignment",
      "alleleFreqThreshold": 0.2,  // TODO:  Is this appropriate?
      "order": 4  // TODO:  Should this be removed? Default is order of addition.
  }
}

function getVCFTrack(trackName, fileS3Key, indexFileS3Key) {
  return {
      "url": fileS3Key,
      "name": trackName,
      "indexURL": indexFileS3Key,
      "indexFilename": "",
      "format": "vcf",
      "type": "variant",
      "alleleFreqThreshold": 0.2,  // TODO:  Is this appropriate?
      "order": 5  // TODO:  Should this be removed? Default is order of addition.
  }
}

export default class API {

  async getFileTrack(row) {
    const fileName = path.basename(row.fileKey);
    const fileType = getFileType(row.fileKey);
    const indexSuffix = getIndexSuffix(fileType);
    const fileURL = await getPresignedS3URL(row.bucket, row.fileKey, signedUrlExpireSeconds);
    const indexFileURL = await getPresignedS3URL(row.bucket, row.fileKey + indexSuffix, signedUrlExpireSeconds);
    if (fileType === 'bam') {
      return getBamTrack(fileName, fileURL, indexFileURL);
    }
    else if (fileType === 'vcf') {
      return getVCFTrack(fileName, fileURL, indexFileURL);
    }
    else {
      throw new Error('Unknown file type for ' + fileName);  // Should not be able to get here but just in case
    }
  }

  async getIGVSessionURL(row) {
    const fileTrack = await this.getFileTrack(row);
    const session = getIGVSessionTemplate();
    session.tracks.splice(1,0, fileTrack);
    const sessionString = JSON.stringify(session);
    const blob = compressString(sessionString);
    const baseIGVURL = window.location.origin; // E.g. 'http://10.76.64.248:8080' or 'http://localhost:3000'
    const url = baseIGVURL + '?sessionURL=blob:' + blob;
    return url;
  }

  async getAvailableFiles(bucket, folderKey) {
    const fileKeys = await getFileKeys(bucket, folderKey);
    return {
      bucket: bucket,
      fileObjects: fileKeys
    }
  }

  async requestFileRestore(row) {
    const indexSuffix = getIndexSuffix(getFileType(row.fileKey));
    const fileResponse = await requestFileRestore(row.bucket, row.fileKey);
    const indexFileResponse = await requestFileRestore(row.bucket, row.fileKey + indexSuffix);
    return {fileResponse: fileResponse, indexFileResponse: indexFileResponse};
  }

  async headObject(row) {
    const response = await headObject(row.bucket, row.fileKey);
    return {response: response};
  }
}
