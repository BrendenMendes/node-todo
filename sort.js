var data = require('./list.json')
var fs = require('fs')

data.forEach((item)=>{
	fs.appendFile('user'+item.userId+'.json', JSON.stringify(item, null, 3)+',\n', (err)=>{
		console.log(err)
	})
})