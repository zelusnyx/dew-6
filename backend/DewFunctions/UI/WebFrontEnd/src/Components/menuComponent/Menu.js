import React, { Component } from 'react';
import { faDownload, faSave, faUpload, faEraser, faSync } from '@fortawesome/free-solid-svg-icons'
import MenuButton from '../parts/MenuButton'
import { Intent } from "@blueprintjs/core";

export class Menu extends Component {
  render() {
    const { addToast } = this.props
    return (
      <>
        <div style={{ flex: 1, backgroundColor: '#EAE6DA', padding: 10, borderRadius: 5 }}>
          <MenuButton icon={faUpload} backgroundColor={'#B7CDC1'} text={'Upload'} intent={Intent.SUCCESS} addToast={addToast} />
          <MenuButton icon={faDownload} backgroundColor={'#84A296'} text={'Download'} intent={Intent.PRIMARY} addToast={addToast} />
          <MenuButton icon={faSave} backgroundColor={'#84A296'} text={'Save'} intent={Intent.SUCCESS} addToast={addToast} />
          <MenuButton icon={faSync} backgroundColor={'#A6A6A6'} text={'Sync'} intent={Intent.PRIMARY} addToast={addToast} />
          <MenuButton icon={faEraser} backgroundColor={'#D93D3D'} text={'Eraser'} intent={Intent.WARNING} addToast={addToast} />
        </div>

      </>
    );
  }
}

export default Menu;
