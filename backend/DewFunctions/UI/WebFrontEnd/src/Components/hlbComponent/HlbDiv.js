import React, { Component } from 'react'
import ResultCard from '../parts/ResultCard'
import { Button, Form } from 'react-bootstrap'
import { Intent } from "@blueprintjs/core";
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DragableInputGroup from '../parts/DragableInputGroup'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'

export default class HlbDiv extends Component {

  constructor(props) {
    super(props)
    this.state = {
      behaviorCount: 1,
      behaviorInputs: [{ id: 1, command: 'Default Line1' }, { id: 2, command: 'Default Line2' }],
      currentActive: -1,
      currentCard: 'Actors',
      behaviorSuggestionLst: ['wait t', 'emit'],
      constraintsSuggestionLst: ['num', 'os', 'link', 'lan', 'interface', 'location', 'nodetype']
    }

    this.fields = {}
  }



  handleOnInputClear = (index) => {
    console.log('clear in input ' + index)
    let temp = this.state.behaviorInputs
    temp[index].command = ''
    this.setState({
      ...this.states,
      behaviorInputs: temp
    })
    this.props.addToast(Intent.WARNING, "Clear one line")
  }

  handleOutInputClear = (index) => {
    console.log('clear out input ' + index)

    let temp = this.state.behaviorInputs
    temp.splice(index, 1)
    this.setState({
      ...this.states,
      behaviorInputs: temp
    })

    this.props.addToast(Intent.DANGER, "Remove one line")

  }

  handleBehaviorValueOnChange = (e, index) => {
    let temp = this.state.behaviorInputs
    temp[index].command = e.target.value
    this.setState({
      ...this.state,
      behaviorInputs: temp
    })
  }

  handleKeyPress = (target, index) => {
    if (target.charCode === 13) {
      if (this.state.behaviorInputs[index] === undefined ||
        (this.state.behaviorInputs[index] !== undefined && this.state.behaviorInputs[index].command === '') ||
        (this.state.behaviorInputs[index] !== undefined && this.state.behaviorInputs[index].command !== '' && this.state.behaviorInputs[index + 1] !== undefined && this.state.behaviorInputs[index + 1].command === '')) {
        this.props.addToast(Intent.DANGER, "Please fill line first")
      } else {
        let temp = this.state.behaviorInputs
        temp.splice(index + 1, 0, { id: this.state.behaviorInputs.length + 1, command: '' })
        this.setState({
          ...this.state,
          behaviorCount: this.state.behaviorCount + 1,
          behaviorInputs: temp
        })
      }
    }
  }


  renderbehaviorInputs = () => {
    if (this.state.behaviorInputs.length === 0) return <Button className='btn-light' onClick={() => this.setState({ ...this.state, behaviorInputs: [{ id: 1, command: '' }] })}><FontAwesomeIcon icon={faPlus} /></Button>
    return (
      <Droppable droppableId={'behavior-droppable'}>
        {provided => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >

            {this.state.behaviorInputs.map((input, index) => <DragableInputGroup
              key={input.id + ''}
              input={input}
              index={index}
              handleOnClickWithSuggestionChange={this.handleOnClickWithSuggestionChange}
              handleKeyPress={this.handleKeyPress}
              handleBehaviorValueOnChange={this.handleBehaviorValueOnChange}
              handleOnInputClear={this.handleOnInputClear}
              handleOutInputClear={this.handleOutInputClear} />)}
            {provided.placeholder}
          </div>
        )}

      </Droppable>
    )
  }

  handleOnClickWithSuggestionChange = (name) => {
    this.setState({
      ...this.state,
      currentCard: name
    })
  }

  renderActorCard = () => {
    return <Form >
      <Form.Group controlId="textareaActor" key={'textareaActor'}>
        <Form.Control as="textarea" rows="5" onClick={() => this.handleOnClickWithSuggestionChange('Actors')} />
      </Form.Group>
    </Form>
  }

  renderConstraintCard = () => {
    return <Form >
      <Form.Group controlId="textareaConstraint" key={'textareaConstraint'}>
        <Form.Control as="textarea" rows="5" onClick={() => this.handleOnClickWithSuggestionChange('Constraints')} />
      </Form.Group>
    </Form>
  }

  renderSuggestionCard = () => {
    if (this.state.currentCard === 'Actors') return <>
      <Button className='btn-light' style={{ margin: 5 }}>Suggestion</Button>
      <Button className='btn-info' style={{ margin: 5 }}>Suggestion</Button>
      <Button className='btn-success' style={{ margin: 5 }}>Suggestion</Button>
      <Button className='btn-danger' style={{ margin: 5 }}>Suggestion</Button>
      <Button className='btn-secondary' style={{ margin: 5 }}>Suggestion</Button>
      <Button className='btn-warning' style={{ margin: 5 }}>Suggestion</Button>
      <Button className='bg-dark border-light' style={{ margin: 5 }}>Suggestion</Button>
      <Button className='btn-primary' style={{ margin: 5 }}>Suggestion</Button>
    </>

    if (this.state.currentCard === 'Behavior') return this.state.behaviorSuggestionLst.map((item, index) => <Button key={'behavior-suggestion-' + index} className='btn-secondary' style={{ margin: 5 }}>{item}</Button>)

    if (this.state.currentCard === 'Constraints') return this.state.constraintsSuggestionLst.map((item, index) => <Button key={'constraints-suggestion-' + index} className='btn-warning' style={{ margin: 5 }}>{item}</Button>)

  }

  onBehaviorDragEnd = result => {
    const { destination, source, draggableId } = result;
    console.log('destination.index', destination.index, 'draggableId', draggableId)
    console.log('source.index', source.index)

    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newBehaviorInputs = Array.from(this.state.behaviorInputs)
    let temp = newBehaviorInputs.splice(source.index, 1)
    newBehaviorInputs.splice(destination.index, 0, temp[0])

    this.setState({
      ...this.state,
      behaviorInputs: newBehaviorInputs
    })
  }

  render() {
    return (
      <>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <div style={{ flex: 2 }}>
            <ResultCard bg='info' header='Actors' render={this.renderActorCard()} />
            <DragDropContext
              /*onDragStart
              onDragUpdate*/
              onDragEnd={this.onBehaviorDragEnd}
            >
              <ResultCard bg='secondary' header='Behavior' render={this.renderbehaviorInputs()} />
            </DragDropContext>
            <ResultCard bg='warning' header='Constraints' render={this.renderConstraintCard()} />
          </div>
          <div style={{ flex: 1 }}>
            <ResultCard bg='dark' header={'Suggestions - ' + this.state.currentCard} height={670} render={this.renderSuggestionCard()} />
          </div>
        </div>
      </>
    )
  }
}
