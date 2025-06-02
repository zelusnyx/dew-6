import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Position, Toaster } from "@blueprintjs/core";

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Menu from './Components/menuComponent/Menu'
import MyNav from './Components/navComponent/MyNav'
import HlbDiv from './Components/hlbComponent/HlbDiv'
import NlpDiv from './Components/nlpComponent/NlpDiv'
import BdgDiv from './Components/bdgComponent/BdgDiv'
import TopDiv from './Components/topComponent/TopDiv'

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  toaster

  refHandlers = {
    toaster: (ref) => this.toaster = ref,
  }

  addToast = (intent, message) => {
    this.toaster.show({ intent, message });
  }

  handleOperationDiv = () => {
    let currentMode = this.props.currentMode
    if (currentMode === 'hlb') return <HlbDiv addToast={this.addToast} />
    if (currentMode === 'nlp') return <NlpDiv addToast={this.addToast} />
    if (currentMode === 'bdg') return <BdgDiv addToast={this.addToast} />
    if (currentMode === 'top') return <TopDiv addToast={this.addToast} />
    if (currentMode === 'hlb') return <HlbDiv addToast={this.addToast} />
  }



  render() {
    return (
      <>
        <Toaster position={Position.TOP_RIGHT} ref={this.refHandlers.toaster}></Toaster>
        <div className='container' style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
          <h1>DEW Interface</h1>
          <div style={{ marginTop: 10 }}>
            <Menu addToast={this.addToast} />

          </div>
          <div style={{ flex: 1, marginTop: 10 }}>
            <MyNav />

            {this.handleOperationDiv()}

          </div>
        </div>
      </>
    );
  }

}

const mapStateToProps = (state) => {
  return {
    currentMode: state.dewMain.currentMode,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    // updateCurrentMode: () => dispatch(switchModeAction())
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
