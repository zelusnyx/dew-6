import React, { Component } from 'react'
import { Nav } from 'react-bootstrap'
import TagButton from '../parts/TagButton'

import { connect } from 'react-redux'
import { switchModeAction } from '../../Actions/switchModeAction'
import './MyNav.css'

class MyNav extends Component {

  handleMenuOnSelect = (selectedKey) => {
    this.props.updateCurrentMode(selectedKey.toString())
  }

  render() {
    return (
      <>
        <Nav
          variant="tabs"
          defaultActiveKey="hlb"
          onSelect={this.handleMenuOnSelect}
          style={{ paddingTop: 10 }}
        >
          <TagButton link={'none'} text={"HLB"} eventKey={'hlb'} isActived={true} isDisabled={false} />
          <TagButton link={'none'} text={"NLP"} eventKey={'nlp'} isActived={false} isDisabled={false} />
          <TagButton link={'none'} text={"Behavior Dependency Graph"} eventKey={'bdg'} isDisabled={false} />
          <TagButton link={'none'} text={"Topology"} eventKey={'top'} isActived={false} isDisabled={false} />
          <TagButton link={'none'} text={"Deploy"} eventKey={'dep'} isActived={false} isDisabled={true} />
        </Nav>
      </>
    )
  }
}
const mapStateToProps = (state) => {
  return {
    currentMode: state.dewMain.currentMode,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    updateCurrentMode: (selectedKey) => dispatch(switchModeAction(selectedKey))
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(MyNav)
