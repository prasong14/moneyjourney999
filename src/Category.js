import { useState, useEffect } from 'react'
import { Button, Modal } from 'react-bootstrap'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Select from 'react-select'
import { format } from 'date-fns'
import { BsPlus, BsTrash, BsPencil } from "react-icons/bs";
import { useForm } from "react-hook-form"

// Firebase
import { useCollectionData } from 'react-firebase-hooks/firestore';
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

if (firebase.apps.length === 0) {
  firebase.initializeApp({
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_DATABASE_URL,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID
  })
}
const firestore = firebase.firestore()
const auth = firebase.auth()

// const data = require('./sampleData.json')

const categories = [
  { id: 0, name: '-- All --' },
  { id: 1, name: 'Food' },
  { id: 2, name: 'Fun' },
  { id: 3, name: 'Transportation' },
]

export default function Category() {
  //category data
  const [id, setId] = useState()
  const [category, setCategory] = useState()
  const [description, setDescription] = useState()
  const { register, handleSubmit } = useForm()
  const [showForm, setShowForm] = useState(false)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [tempData, setTempData] = useState({
    id: null,
    createdAt: new Date(),
    description: '',
    amount: 0,
    category: categories[0]
  })

  // Firebase stuff
  const categoryRef = firestore.collection('category');
  const query = categoryRef.orderBy('createdAt', 'asc').limitToLast(100);
  const [data] = useCollectionData(query, { idField: 'id' });

  // This will be run when 'data' is changed.
  useEffect(() => {
    if (data) { // Guard condition
      let t = 0
      let r = data.map((d, i) => {
        t += d.amount
        console.log(data)
        return (
          <JournalRow
            data={d}
            i={i}
            onDeleteClick={handleDeleteClick}
            onEditClick={handleEditClick}
          />
        )
      })

      setRecords(r)
      setTotal(t)
    }
  },
    [data])

  // Handlers for Modal Add Form
  const handleshowForm = () => setShowForm(true)

  // Handlers for Modal Add Form
  const handleCloseForm = () => {
    console.log("close form")
    setTempData({
      id: null,
      createdAt: new Date(),
      description: '',
      category: categories[0]
    })
    setId()
    setDescription()
    setCategory()
    setShowForm(false)
    setEditMode(false)
  }

  // Handle Add Form submit
  const onSubmit = async (data) => {
    console.log('Hellosubmit')
    let preparedData = {
      description: data.description,
      createdAt: new Date(data.createdAt),
      category: category
    }
    console.log('onSubmit', preparedData)
  }

// Handler for data changing
const addCategory = () => {
    if(editMode){
        console.log("edit category")
        console.log(id)
        console.log(category)
        console.log(description)
        firestore.collection("category").doc(id).set({name: category, description: description, createdAt: firebase.firestore.FieldValue.serverTimestamp()})
    }
    else{
        console.log("add category")
        console.log(category)
        console.log(description)
        firestore.collection("category").add({name: category, description: description, createdAt: firebase.firestore.FieldValue.serverTimestamp()})
    }
    handleCloseForm()
}

  const handleDeleteClick = (id) => {
    console.log('handleDeleteClick in Journal', id)
    if (window.confirm("Are you sure to delete this record?"))
      categoryRef.doc(id).delete()
  }

  const handleEditClick = (data) => {
    let preparedData = {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt.toDate(),
    }
    console.log("handleEditClick", preparedData)
    // expect original data type for data.createdAt is Firebase's timestamp
    // convert to JS Date object and put it to the same field
    // if ('toDate' in data.createdAt) // guard, check wther toDate() is available in createdAt object.
    //   data.createdAt = data.createdAt.toDate()

    setTempData(preparedData)
    setId(data.id)
    setCategory(data.name)
    setDescription(data.description)
    setShowForm(true)
    setEditMode(true)
  }


  return (
    <Container>
      <Row>
        <Col>
          <h1>Category</h1>
          <Button variant="outline-dark" onClick={handleshowForm}>
            <BsPlus /> Add
      </Button>
        </Col>

      </Row>

      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>#</th>
            <th>Category</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {records}
        </tbody>
      </Table>


      <Modal
        show={showForm} onHide={handleCloseForm}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="hidden"
            placeholder="ID"
            ref={register({ required: true })}
            name="id"
            id="id"
            defaultValue={tempData.id}
          />
          <Modal.Header closeButton>
            <Modal.Title>
              {editMode ? "Edit Record" : "Add New Record"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>

          <Row>
              <Col>
                <label htmlFor="category">Category</label>
              </Col>
              <Col>
                <input
                  type="text"
                  placeholder="category"
                  ref={register({ required: true })}
                  name="category"
                  id="category"
                  defaultValue=""
                  onChange={event => setCategory(event.target.value)}
                />
              </Col>
            </Row>

            <Row>
              <Col>
                <label htmlFor="description">Description</label>
              </Col>
              <Col>
                <input
                  type="text"
                  placeholder="Description"
                  ref={register({ required: false })}
                  name="description"
                  id="description"
                  defaultValue={tempData.description}
                  onChange={event => setDescription(event.target.value)}
                />
              </Col>
            </Row>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseForm}>
              Close
          </Button>
            <Button variant={editMode ? "success" : "primary"} type="submit" onClick={addCategory}>
              {editMode ? "Save Record" : "Add Record"}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

    </Container>
  )
}

function JournalRow(props) {
  let d = props.data
  console.log("JournalRow", d)
  return (
    <tr>
      <td>
        <BsTrash onClick={() => props.onDeleteClick(d.id)} />
        <BsPencil onClick={() => props.onEditClick(d)} />
      </td>
      <td>{d.name}</td>
      <td>{d.description}</td>
    </tr>
  )
}


