//FrameWorks

const low = require('lowdb')
const swal = require("sweetalert")
var CryptoJS = require("crypto-js");
const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const bodyParser = require("body-parser")
const rg = require('rangen');

// Configurações banco de dados
const FileSync = require("lowdb/adapters/FileSync");
const { use } = require('express/lib/application');
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

// Pagina Login
app.get('/login', function (req, res) {
    res.render('./form_login')

})
app.get('/', function (req, res) {
    res.render('./home')
})

app.get('/view', function (req, res) {
    res.render('./view')
})
app.post('/view', function (req, res) {
    res.send(`<script>window.location.replace("./wallet/${req.body.address}");</script>`)
})

app.get('/wallet/:address', function (req, res) {
    console.log(req.params.address)
    if (db.get('wallets')
    .some(user => user.name === req.params.address)
    .value() === true) {
    let user = db
    .get("wallets")
    .find({ name: req.params.address })
    .value()

res.render('./wallet', {nome: user.name,saldo: user.currency, address: user.address})
    }else{
        res.render('./aviso', {message: `Está carteira não existe!`,re_page: "../view",image: "error.png"})
    }
})
// Pagina perfil
app.post('/logado', function (req, res) {
    if (db.get('wallets')
        .some(user => user.name === req.body.nome)
        .value() === true) {
        let user = db
            .get("wallets")
            .find({ name: req.body.nome })
            .value()
        var senha = CryptoJS.AES.decrypt(user.pass, req.body.pass)
        if (senha.toString(CryptoJS.enc.Utf8) == "senha_verdadeira") {
            res.render('./perfil', { nome: user.name, email: user.email, saldo: user.currency, address: user.address, id: user.id })
            console.log(`[SERVER] ${user.name}@ews acessou sua carteira`)
            app.get('/logado/transfer', function (req, res) {
                res.render('./transfer', { nome: user.name, email: user.email, saldo: user.currency, address: user.address, id: user.id })
                app.post('/acao_transfer', function (req, res) {
                    let alvo = req.body.destino
                    let valor = req.body.valor
                    let pass = req.body.senha
                    var senha2 = CryptoJS.AES.decrypt(user.pass, pass)
                    if (senha2.toString(CryptoJS.enc.Utf8) == "senha_verdadeira") {
                        if (db.get('wallets')
                        .some(user => user.name === alvo)
                        .value() === true) {
                            console.log(alvo)
                            if(user.currency >= valor){
                                let dbalvo = db
                                .get("wallets")
                                .find({ name: alvo })
                                .value();
                                let real_value = Number(dbalvo.currency) + Number(valor)
                                let me_value = Number(user.currency) - Number(valor)
                                console.log(real_value)
                                db.get("wallets")
                                .find({ name: user.name })
                                .assign({currency: me_value})
                                .write();
                                db.get("wallets")
                                .find({ name: alvo })
                                .assign({currency: real_value})
                                .write();
                                res.render('./aviso', {message: `Sua transferência de ${valor} LOZ para ${alvo} foi aprovada!`,re_page: "./login",image: "cash_done.png"})
                            }else{
                                res.render('./aviso', {message: `Sua transferência de ${valor} LOZ para ${alvo} foi negada! (Saldo insuficiente)`,re_page: "./login",image: "error.png"})
                            }
               
                            
                        }else{
                            res.send('<script>window.alert("Esse Usuario não existe!"); window.location.replace("../login");</script>')
                            res.render('./aviso', {message: `Este usuario não existe!`,re_page: "./login",image: "error.png"})
                        }
                    }else {
                        res.render('./aviso', {message: `Senha incorreta!`,re_page: "./login",image: "error.png"})
                    }

                })
            })
        } else {
            res.render('./aviso', {message: `Senha incorreta!`,re_page: "./login",image: "error.png"})
        }
    } else {
        res.send('<script>window.alert("Esse usuario não existe!"); window.location.replace("./");</script>')
    }
})



app.post('/acao_cadastro', function (req, res) {
    let receber = req.body
    const gerar_token = rg.id({ length: 20, charSet: 'alphanum' });
    console.log(db.get('wallets')
        .some(user => user.name === receber.nome)
        .value())
    if (db.get('wallets')
        .some(user => user.name === receber.nome)
        .value() === false) {
        if (db.get('wallets')
            .some(user => user.email === receber.email)
            .value() === false) {
            const gen_id = rg.id({ length: 5, charSet: 'num' })
            db.get("wallets")
                .push({
                    id: gen_id,
                    address: receber.nome + "@ews",
                    name: receber.nome,
                    email: receber.email,
                    groups: ["client"],
                    currency: 0,
                    pass: CryptoJS.AES.encrypt("senha_verdadeira", receber.pass).toString()
                }).write();
                console.log(`[SERVER] Nova carteira criada, ${receber.nome}@ews`)

            res.render('./aviso', {message: `Você criou uma carteira com sucesso!`,re_page: "./login",image: "wallet_done.png"})
        } else {
            res.render('./aviso', {message: `Este email já está registrado!`,re_page: "./login",image: "error.png"})
        }
    } else {
        res.render('./aviso', {message: `Este usuario está registrado!`,re_page: "./login",image: "error.png"})

    }
})


// Respostas servidor
app.listen(3025, '26.71.86.0', function () {
    console.log("Servidor Rodando http://192.168.1.69:3025")
})