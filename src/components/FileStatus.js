import React from 'react';
import Button from '@mui/material/Button';
import API from '../api/API.js'
import igv from 'igv';

const api = new API();


async function openIGV(row) {
	const track = await api.getFileTrack(row);
	await igv.browser.loadTrack(track);
}

async function openIGVSession(row) {
	const url = await api.getIGVSessionURL(row);
	window.open(url);
}

async function requestFileRestore(row) {
	try {
		const response = await api.requestFileRestore(row);
		console.log(response);
		alert('Restore initiated');
		// TODO:  Reload only the row containing this component or at least only the file table container.
		// TODO:  Preserve current folder on reload.
		window.location.reload();
	}
	catch (e) {
		alert(e);
	}
}

function ViewInIGVButton(props) {
	return <Button variant="contained" color="primary" onClick={openIGV.bind(this, props.row)}>Add Track</Button>;
}

function ViewSessionInIGVButton(props) {
	return <Button variant="contained" color="primary" onClick={openIGVSession.bind(this, props.row)}>View As Session</Button>;
}

function RequestRestoreButton(props) {
	return <Button variant="contained" color="primary" onClick={requestFileRestore.bind(this, props.row)}>Restore</Button>;
}

export default function FileStatus(props) {
	const fileStatus = props.row.fileStatus;
	if (fileStatus === "AVAILABLE") {
		return (
			<>
				<ViewInIGVButton row={props.row} />;
				<ViewSessionInIGVButton row={props.row} />;
			</>
		);
	} else if (fileStatus === "RESTORE REQUESTED") {
		return (
			<>
			</>
		);
	} else if (fileStatus === "NEEDS RESTORATION") {
		return (
			<>
				<RequestRestoreButton row={props.row} />
			</>
		);
	};
}
