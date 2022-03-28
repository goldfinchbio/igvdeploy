import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import IGVBrowser from './components/IGVBrowser';
import MenuAppBar from './components/MenuAppBar';
import './App.css';
import AppConfig from './config.js';
import FileTable from './components/FileTable';
import S3FolderForm from './components/S3FolderForm';


const theme = createTheme();

function UserInfoAndSignOut(props) {
  return (
    <div styles={{display: "flex", alignItems: "center"}}>
      Logged in as {props.user.username}
      <Button onClick={props.signOut}>Sign out</Button>
    </div>
  );
}

const defaultS3Folder = AppConfig.DEFAULT_DATA_FOLDER;

function App({ signOut, user }) {

  const [s3Folder, setS3Folder] = useState(defaultS3Folder);

  return (
    <>
      <ThemeProvider theme={theme}>
        <div className="App">
          <UserInfoAndSignOut user={user} signOut={signOut}/>
          <MenuAppBar />
          <S3FolderForm setS3Folder={setS3Folder} />
          <hr/>
          <FileTable s3Folder={s3Folder} />
        </div>
        <IGVBrowser />
      </ThemeProvider>
    </>
  );
}

// export default App;
export default withAuthenticator(App);
