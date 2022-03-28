import React, { useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import API from '../api/API.js'
import FileStatus from './FileStatus'

const useStyles = makeStyles((theme) => ({
    button: {
      margin: theme.spacing(1),
    },
    table: {
        minWidth: 550,
      },
  }));

function parseBucketAndFolder(s3Folder) {
  var prefixLength = 's3://'.length;
  var bucket = s3Folder.slice(prefixLength, s3Folder.indexOf('/', prefixLength));
  var folder = s3Folder.slice(prefixLength + bucket.length + 1);
  return {
    bucket: bucket,
    folder: folder
  }
}

const api = new API();

function FolderStatus(props) {
  if (props.folderName && props.folderName.length > 0) {
    return <div>Showing {props.folderName}</div>;
  } else {
    return <div>No S3 folder specified</div>
  }
}

async function getTableData(s3Folder) {
  const {bucket, folder} = parseBucketAndFolder(s3Folder);
  var availableFilesObject = await api.getAvailableFiles(bucket, folder);
  var tableData = [];
  for (let fileObj of availableFilesObject.fileObjects) {
    tableData.push(fileObj);
  }
  return tableData;
}

export default function FileTable(props) {
  const classes = useStyles();
  const [tableData, setTableData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {

    async function loadTableData(s3Folder) {
      try {
        setDataLoaded(false);
        const data = await getTableData(s3Folder);
        setTableData(data);
        setDataLoaded(true);
        setHasError(false);
        setErrorMsg('');
      } catch (err) {
        setDataLoaded(true);
        setHasError(true);
        setErrorMsg(err);
        console.error(err);
      }
    }

    if (props.s3Folder && props.s3Folder.length > 0) {
      loadTableData(props.s3Folder);
    } else {
      setDataLoaded(true);
    }

    return () => {
    }
  }, [props.s3Folder]);


  if (!dataLoaded) {
    return <div>Loading file data...</div>
  }
  var folderName = props.s3Folder;
  if (folderName && !folderName.endsWith('/')) {
    folderName += '/';
  }
  if (hasError) {
    var status = "Error loading " + folderName + ":  " + errorMsg;
    return (
      <div style={{ backgroundColor: "lightCoral" }} >
        {status}
      </div>
    );
  }
  return (
    <>
      <FolderStatus folderName={folderName} />
      <hr/>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>S3 Bucket</TableCell>
              <TableCell>File Key</TableCell>
              <TableCell>Storage Class</TableCell>
              <TableCell>File Status</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.bucket + ':' + row.fileKey}>
                <TableCell component="th" scope="row">
                  {row.bucket}
                </TableCell>
                <TableCell>{row.fileKey}</TableCell>
                <TableCell>{row.storageClass}</TableCell>
                <TableCell>{row.fileStatus}</TableCell>
                <TableCell>
                  <FileStatus row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
