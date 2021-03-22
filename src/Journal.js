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
import { isCompositeComponent } from 'react-dom/test-utils'

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


// Add all category
var categories = [
  { id: 0, name: '-- All --' }
]
let cat_i = 0
firestore.collection("category").get()
.then(data=>{
data.forEach(doc=>{
  cat_i += 1
  console.log(doc.data())
  categories.push({ id: cat_i, name: doc.data().name})
})
})

export default function Journal() {
  const [id, setId] = useState()
  const [date, setDate] = useState()
  const [description, setDescription] = useState()
  const [category, setCategory] = useState()
  const [amount, setAmount] = useState()

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

  const moneyRef = firestore.collection('money');
  const query = moneyRef.orderBy('createdAt', 'asc').limitToLast(100);
  const [data] = useCollectionData(query, { idField: 'id' });


  // This will be run when 'data' is changed.
  useEffect(() => {
    if (data) { // Guard condition
      let t = 0
      let r = data.map((d, i) => {
        // console.log('useEffect', format(d.createdAt.toDate(), "yyyy-MM-dd"))
        t += parseFloat(d.amount)
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


  const handleCategoryFilterChange = (obj) => {
    console.log('filter', obj)
    console.log(data)
    if (data) { // Guard condition      
      let t = 0
      let filteredData = data.filter(d => obj.id == 0 || d.category == obj.name)
      let r = filteredData.map((d, i) => {
        console.log('filter', d)
        t += parseFloat(d.amount)
        return (
          <JournalRow data={d} i={i} />
        )
      })

      setRecords(r)
      setTotal(t)
    }
  }


  // Handlers for Modal Add Form
  const handleshowForm = () => setShowForm(true)

  // Handlers for Modal Add Form
  const handleCloseForm = () => {
    setTempData({
      id: null,
      createdAt: new Date(),
      description: '',
      amount: 0,
      category: categories[0]
    })
    setId()
    setDate()
    setCategory({})
    setDescription()
    setAmount()
    setShowForm(false)
    setEditMode(false)
  }

  // Handle Add Form submit
  const onSubmit = async (data) => {
    let preparedData = {
      // ...data,
      description: data.description,
      amount: parseFloat(data.amount),
      createdAt: new Date(data.createdAt),
      category: category
    }
    console.log('onSubmit', preparedData)


    if (editMode) {
      // Update record
      console.log("UPDATING!!!!", data.id)
      await moneyRef.doc(data.id)
        .set(preparedData)
        .then(() => console.log("moneyRef has been set"))
        .catch((error) => {
          console.error("Error: ", error);
          alert(error)
        });
    } else {
      console.log("Going")
      // Add to firebase
      // This is asynchronous operation, 
      // JS will continue process later, so we can set "callback" function
      // so the callback functions will be called when firebase finishes.
      // Usually, the function is called "then / error / catch".
      //await moneyRef
        //.add(preparedData)
        //.then(() => console.log("New record has been added."))
        //.catch((error) => {
          //console.error("Errror:", error)
          //alert(error)
        //})
      // setShowForm(false)
    }
    handleCloseForm()
  }

  // Handler for data changing
const addJournal= () => {
  let date_data = date
  let category_data = category
  if(!category_data){
    console.log("set uncategorized")
    category_data = {name:"uncategorized"}
  }
  if(!date_data){
    console.log("set current date")
    let current_date = new Date()
    date_data = (format(current_date, "yyyy-MM-dd"))
  }
  if(editMode){
    console.log("add journal")
    console.log(date_data)
    console.log(description)
    console.log(category_data.name)
    console.log(amount)
    firestore.collection("money").doc(id).set({description: description, category: category_data.name , amount: amount , createdAt: date_data})
  }
  else{
    console.log("add journal")
    console.log(date_data)
    console.log(description)
    console.log(category_data.name)
    console.log(amount)
    firestore.collection("money").add({description: description, category: category_data.name , amount: amount , createdAt: date_data})
  }
  handleCloseForm()
}


  const handleCategoryChange = (obj) => {
    console.log('handleCategoryChange', obj)
    setCategory(obj)
  }

  const handleDeleteClick = (id) => {
    console.log('handleDeleteClick in Journal', id)
    if (window.confirm("Are you sure to delete this record?"))
      moneyRef.doc(id).delete()
  }

  const handleEditClick = (data) => {
    console.log("edit data", data.id)
    let preparedData = {
      id: data.id,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      createdAt: data.createdAt,
    }
    console.log("handleEditClick", preparedData)

    let date_data = data.date
    let category_data = data.category
    if(!category_data.name){
      console.log("set uncategorized")
      category_data = {name:"uncategorized"}
    }
    if(!date_data){
      console.log("set current date")
      let current_date = new Date()
      date_data = (format(current_date, "yyyy-MM-dd"))
    }

    setId(data.id)
    setDate(date_data)
    setCategory(category_data)
    setDescription(data.description)
    setAmount(data.amount)

    setTempData(preparedData)
    setShowForm(true)
    setEditMode(true)
  }


  return (
    <Container>
      <Row>
        <Col>
          <h1>Journal</h1>
          <Button variant="outline-dark" onClick={handleshowForm}>
            <BsPlus /> Add
      </Button>
        </Col>
        <Col>
          Category:
          <Select
            options={categories}
            getOptionLabel={x => x.name}
            getOptionValue={x => x.id}
            onChange={handleCategoryFilterChange}
          />
        </Col>

      </Row>

      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {records}
        </tbody>
        <tfooter>
          <td colSpan={5}>
            <h2>Total: {total}</h2>
          </td>
        </tfooter>
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
                <label htmlFor="createdAt">Date</label>
              </Col>
              <Col>
                <input
                  type="date"
                  placeholder="Date"
                  ref={register({ required: true })}
                  name="createdAt"
                  id="createdAt"
                  defaultValue={tempData.createdAt, "yyyy-MM-dd"}
                  onChange={event => setDate(event.target.value)}
                />

              </Col>
            </Row>

            <Row>
              <Col>
                <label htmlFor="category">Category</label>
              </Col>
              <Col>
                <Select
                  id="category"
                  name="category"
                  value={category}
                  placeholder="Category"
                  options={categories.filter(c => c.id != 0)}
                  onChange={handleCategoryChange}
                  getOptionLabel={x => x.name}
                  getOptionValue={x => x.id}
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
                  ref={register({ required: true })}
                  name="description"
                  id="description"
                  defaultValue={tempData.description}
                  onChange={event => setDescription(event.target.value)}
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <label htmlFor="amount">Amount</label>
              </Col>
              <Col>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Amount"
                  ref={register({ required: true })}
                  name="amount"
                  id="amount"
                  defaultValue={tempData.amount}
                  onChange={event => setAmount(event.target.value)}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseForm}>
              Close
          </Button>
            <Button variant={editMode ? "success" : "primary"} type="submit" onClick={addJournal}>
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
  var cat_display = "uncategorized"
  // console.log("JournalRow", d)
  console.log("data showing")
  var found = false;
  for(let i = 0; i < categories.length; i++) {
      if (categories[i].name == d.category) {
          found = true;
          break;
      }
  }
  if(found){
    cat_display = d.category
  }
  return (
    <tr>
      <td>
        <BsTrash onClick={() => props.onDeleteClick(d.id)} />
        <BsPencil onClick={() => props.onEditClick(d)} />
      </td>
      <td>{d.createdAt}</td>
      <td>{d.description}</td>
      <td>{cat_display}</td>
      <td>{d.amount}</td>
    </tr>
  )
}