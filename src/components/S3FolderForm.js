import React from 'react';
import Button from '@mui/material/Button';


export default class S3FolderForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {value: ''};

		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleChange(event) {
		this.setState({ value: event.target.value });
	}

	handleSubmit(event) {
		event.preventDefault();
		if (!this.state.value) {
			alert('No value entered');
			return false;
		}
		// setFolder(this.props.setS3Folder, this.state.value);
    this.props.setS3Folder(this.state.value);
	}

	render() {
		return (
			<form onSubmit={this.handleSubmit}>
				<label>
					S3 Folder:
					<br/>
					<input type="text" size="50" value={this.state.value} onChange={this.handleChange} />
				</label>
				<Button size="small" variant="contained" color="primary" type="submit">Submit</Button>
			</form>
		);
	}
}