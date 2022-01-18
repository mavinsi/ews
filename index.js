//FrameWorks

const low = require('lowdb')

var CryptoJS = require("crypto-js");
const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const bodyParser = require("body-parser")
const rg = require('rangen');

// Configurações banco de dados
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("database/server.json");
const db = low(adapter);

// Configurações de renderização 

var handle = handlebars.create({
    defaultLayout: 'main'
});

app.use(express.static('public')); 
app.use('/images', express.static('images'));
app.engine('handlebars', handle.engine);

app.set('view engine', 'handlebars');
// Configurações BodyParser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Rotas
app.use('/uploads', express.static(__dirname + '/public'));
app.get('/registrar', function (req, res) {
    res.render('./form_register')
})
app.get('/login', function (req, res) {
    res.render('./form_login')

})
app.post('/logado', function (req, res) {
    console.log(req.body.nome)

    if(db.get('wallets')
    .some(user => user.name  === req.body.nome)
    .value() === true ){
    let user = db
    .get("wallets")
    .find({ name: req.body.nome})
     .value()
     console.log(user.pass)
console.log(req.body.pass)
    var senha = CryptoJS.AES.decrypt(user.pass,req.body.pass)
    console.log(senha.toString(CryptoJS.enc.Utf8))
    if(senha.toString(CryptoJS.enc.Utf8) == "senha_verdadeira"){
        res.render('./perfil', {nome: user.name, email: user.email, saldo: user.currency})
    }else{
        res.send('<script>window.alert("Senha incorreta!"); window.location.replace("./login");</script>')
    }
}else{
    res.send('<script>window.alert("Esse usuario não existe!"); window.location.replace("./login");</script>')
}
    
})
app.post('/acao_cadastro', function (req, res) {
    

    let receber = req.body
    console.log(req.body.nome)
    console.log(req.body.email)
    console.log(req.body.pass)
    const gerar_token = rg.id({length: 20, charSet: 'alphanum'});
    console.log(gerar_token)
console.log(db.get('wallets')
.some(user => user.name  === receber.nome)
.value())
if(db.get('wallets')
.some(user => user.name  === receber.nome)
.value() === false ){
    if(db.get('wallets')
.some(user => user.email  === receber.email)
.value() === false ){
    db.get("wallets")
    .push({

        name: receber.nome,
        email: receber.email,
        admin: false,
        currency: 0,
        pass: CryptoJS.AES.encrypt("senha_verdadeira", receber.pass).toString()
    }).write();
    res.send('<script> window.location.replace("./login");</script>')
}else{
    res.send('<script>window.alert("Esse endereço (C-MAIL) já foi adquirido!"); window.location.replace("./registrar");</script>')
}
}else{
    res.send('<script>window.alert("Esse usuario já existe!"); window.location.replace("./registrar");</script>')
 
}
})
// Respostas servidor
app.listen(8080, function () {
    console.log("Servidor Rodando http://localhost:8080")
})