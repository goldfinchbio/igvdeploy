import React, { Component } from 'react'
import igv from 'igv';

var igvStyle = {
    paddingTop: '10px',
    paddingBottom: '10px',
    margin: '8px',
    border: '1px solid lightgray'
  }
  
class IGVBrowser extends Component {
    setGenome = genome => {
        this.setState({ genome })
    };
    state = {
        genome: 'hg38',
        locus: '',
        setGenome: this.setGenome
    };
    createIGV() {
        const igvContainer = document.getElementById('igv-div');
        const igvOptions = {genome: this.state.genome , locus: this.state.locus, queryParametersSupported: true};
        return igv.createBrowser(igvContainer, igvOptions);
    };
    updateIGV = (event) => {
        this.setGenome(event.target.value)
        console.log(event.target.value)
    }

    async componentDidMount() {
      igv.browser = await this.createIGV()
    }    
  
    render() {
      return (
        <div>
            <div id="igv-div" style={igvStyle}></div>            
        </div>
      );
    }
  }

export default IGVBrowser