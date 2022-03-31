const express = require("express");
const PORT = process.env.PORT || 8080;

const TronWeb = require('tronweb')
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider("https://api.trongrid.io");
const solidityNode = new HttpProvider("https://api.trongrid.io");
const eventServer = new HttpProvider("https://api.trongrid.io");
const fullHost = 'https://api.trongrid.io';
const app = express();

//=====================================================Time and Cart Total Calculation ===========================================
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Tron Api")
});

//===========  Get Balance of tiny bar from an account


app.post("/getusdtbalance", async (req, res) => {

    const privatekey = req.headers.privatekey;
    var address = req.query.address;
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privatekey);
    const trc20ContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; //contract address

    try {
        let contract = await tronWeb.contract().at(trc20ContractAddress);
        let result = await contract.balanceOf(address).call();
        amount = tronWeb.toDecimal(result._hex)/1000000
        res.send({
            "balance": amount,
            "token": "USDT"
        })
    } catch (error) {
        console.log(error.message)
        res.send(error.message)
    }
});



app.post("/sendtron", async (req, res) => {
    var privateKey = req.headers.privatekey
    const tronWeb = new TronWeb({
        fullHost: fullHost,
        privateKey: privateKey
    })
    var amount = req.body.amount
    var senderaddress = tronWeb.address.fromPrivateKey(privateKey);
    var receiveraddress = req.body.receiver
    const tradeobj = await tronWeb.transactionBuilder.sendTrx(receiveraddress, amount * 1000000, senderaddress, 1);
    const signedtxn = await tronWeb.trx.sign(tradeobj, privateKey);
    const receipt = await tronWeb.trx.sendRawTransaction(signedtxn);
    console.log(receipt)
    res.send(receipt)

});


app.post("/sendusdt", async (req, res) => {
    const privatekey = req.headers.privatekey
    const receiveraddress = req.body.receiver
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privatekey);
    const trc20ContractAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";//contract address
    const addressTo = receiveraddress;
    var amount_send  = 1

        try {
            const ownerAddress = tronWeb.address.fromPrivateKey(privatekey);
            const contractAddressHex = tronWeb.address.toHex(trc20ContractAddress);
            const contractInstance = await tronWeb.contract().at(contractAddressHex);
            const decimals = await contractInstance.decimals().call();
            const amount = amount_send * 1000000
            const response = await contractInstance.transfer(addressTo, amount).send();
            console.log(response);
            res.send({"transaction_hash":response})
        } catch (e) {
            console.error(e);
            res.send(e.message)
        }

});



app.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});