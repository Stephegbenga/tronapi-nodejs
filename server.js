const express = require("express");
const PORT = process.env.PORT || 8080;

const TronWeb = require("tronweb");
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider("https://api.trongrid.io");
const solidityNode = new HttpProvider("https://api.trongrid.io");
const eventServer = new HttpProvider("https://api.trongrid.io");
const fullHost = "https://api.trongrid.io";
const app = express();

//=====================================================Time and Cart Total Calculation ===========================================
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Tron Api");
});

//===========  Get Balance of tiny bar from an account

app.post("/trctokenbalance", async (req, res) => {
    const privateKey = req.headers.privatekey;
    const trc20ContractAddress = req.body.contractaddress;
    const address = req.body.accountaddress;

    if (privateKey == null) {
        res.status(404).send("privatekey must be provided");
    } else if (trc20ContractAddress == null) {
        res.status(404).send("amount to be sent is missing");
    } else if (address == null) {
        res.status(404).send("receiver wallet address is missing");
    }

    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    //contract address TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t

    try {
        let contract = await tronWeb.contract().at(trc20ContractAddress);
        let symbol = await contract.symbol().call();
        let result = await contract.balanceOf(address).call();
        amount = tronWeb.toDecimal(result._hex) / 1000000;
        res.send({
            balance: amount,
            token: symbol,
        });
    } catch (error) {
        console.log(error.message);
        res.send(error.message);
    }
});

app.post("/sendtron", async (req, res) => {
    var amount = req.body.amount;
    var receiveraddress = req.body.receiver;
    var privateKey = req.headers.privatekey;

    if (privateKey == null) {
        res.status(404).send("privatekey must be provided");
    } else if (amount == null) {
        res.status(404).send("amount to be sent is missing");
    } else if (receiveraddress == null) {
        res.status(404).send("receiver wallet address is missing");
    }

    if (privateKey == null) {
        res.status(404).send("privatekey must be provided");
    }
    const tronWeb = new TronWeb({
        fullHost: fullHost,
    });
    const senderaddress = tronWeb.address.fromPrivateKey(privateKey);
    const tradeobj = await tronWeb.transactionBuilder.sendTrx(
        receiveraddress,
        amount * 1000000,
        senderaddress,
        1
    );
    const signedtxn = await tronWeb.trx.sign(tradeobj, privateKey);
    const receipt = await tronWeb.trx.sendRawTransaction(signedtxn);
    console.log(receipt);
    res.send(receipt);
});

app.post("/sendtokentrc", async (req, res) => {
    const privateKey = req.headers.privatekey;
    const addressTo = req.body.receiver;
    const trc20ContractAddress = req.body.contractaddress; //contract address TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
    var amount_send = req.body.amount;

    if (privateKey == null) {
        res.status(404).send("privatekey must be provided");
    } else if (amount_send == null) {
        res.status(404).send("amount to be sent is missing");
    } else if (addressTo == null) {
        res.status(404).send("receiver wallet address is missing");
    } else if (trc20ContractAddress == null) {
        res.status(404).send("contract address is missing");
    }

    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

    try {
        const ownerAddress = tronWeb.address.fromPrivateKey(privateKey);
        const contractAddressHex = tronWeb.address.toHex(trc20ContractAddress);
        const contractInstance = await tronWeb.contract().at(contractAddressHex);
        const decimals = await contractInstance.decimals().call();
        const amount = amount_send * 1000000;
        const response = await contractInstance.transfer(addressTo, amount).send();
        console.log(response);
        res.send({
            transaction_hash: response,
        });
    } catch (e) {
        console.error(e);
        res.send(e.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});