var app = require('express')()
var bodyParser = require('body-parser')
var cors = require('cors')
var fs = require('fs')
var jwt = require('jsonwebtoken')
const { Readable } = require('stream')

var userId = 10

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res)=>{
	res.sendStatus(200)
})

app.post('/signup', (req, res)=>{
	res.send(signUp(req.body.username, req.body.password))
})

app.post('/login', (req, res)=>{
	res.send(login(req.body.username, req.body.password))
})

app.post('/fetch', verifyToken, (req, res)=>{
	try{
		let data = ''
		var readableStream = Readable.from(fetch(req.username));
		readableStream.pipe(res)
	}
	catch(e){
		res.send(e)
	}
})

app.post('/add', verifyToken, (req, res)=>{
	res.send(addItem(req.username, req.body.item))
})

app.post('/status', verifyToken, (req, res)=>{
	res.send(changeStatus(req.username, req.body.id))
})

app.post('/delete', verifyToken, (req, res)=>{
	res.send(deleteItem(req.username, req.body.id))
})

app.listen(5000)

function signUp(username, password){
	if(username && password){
		let userList = fs.readFileSync('./users.json')
		userList = JSON.parse(userList)
		let users = Object.keys(userList)
		if (!users.includes(username)){
			userId += 1
			userList[username] = {}
			userList[username].id = userId
			userList[username].password = password
			fs.writeFileSync('users.json', JSON.stringify(userList, null, 3));
			fs.writeFileSync('./users/'+username.toLowerCase()+'.json', '[]');
			let token = jwt.sign({ username, password, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 6) }, 'secretkeyforhmacsha256');
			return({ token })
		}
		else{
			return 409
		}
	}
	else{
		return 400
	}
}

function login(username, password){
	if(username && password){
		let userList = require('./users.json')
		if(userList[username] && userList[username].password == password){
			let token = jwt.sign({ username, password, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 6) }, 'secretkeyforhmacsha256');
			return({token})
		}
		else{
			return 418
		}
	}
	else{
		return 400
	}
}

function fetch(username){
	if(username){
		let data = fs.readFileSync('./users/'+username.toLowerCase()+'.json')
		return JSON.stringify(JSON.parse(data))
	}
	else{
		throw 406
	}
}

function verifyToken(req, res, next){
	if(req.headers.authorization != undefined && req.headers.authorization.split(' ')[1]){
		var decoded = jwt.verify(req.headers.authorization.split(' ')[1], 'secretkeyforhmacsha256');
		var userList = require('./users.json')
		if(userList[decoded.username] && userList[decoded.username].password == decoded.password){
			req.username = decoded.username
			next()
		}
		else{
			res.sendStatus(417)
		}
	}
	else{
		res.sendStatus(401)
	}
}

function addItem(user, item){
	let data = fs.readFileSync('./users/'+user.toLowerCase()+'.json')
	data = JSON.parse(data)
	let entry = {
		userId : user,
		id : new Date().getTime(),
      	title : item,
     	completed : false
	}
	data.unshift(entry)
	fs.writeFileSync('./users/'+user.toLowerCase()+'.json', JSON.stringify(data, null, 3));
	return JSON.stringify(entry)
}

function changeStatus(user, id){
	let data = fs.readFileSync('./users/'+user.toLowerCase()+'.json')
	data = JSON.parse(data)
	for(let i = 0; i < data.length; i++){
		if(data[i].id == id){
			data[i].completed = !data[i].completed
			break;
		}
	}
	fs.writeFileSync('./users/'+user.toLowerCase()+'.json', JSON.stringify(data, null, 3));
	return 200
}

function deleteItem(user, id){
	let data = fs.readFileSync('./users/'+user.toLowerCase()+'.json')
	data = JSON.parse(data).filter((task)=>{
		return task.id != id
	})
	fs.writeFileSync('./users/'+user.toLowerCase()+'.json', JSON.stringify(data, null, 3));
	return 200
}