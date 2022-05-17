const express = require("express");
const PORT = process.env.PORT || 8080;
const TronWeb = require("tronweb");
const fullHost = 'https://trx.getblock.io/mainnet'
const headers = {
    'x-api-key': '3179faad-3d82-4b25-bd60-bf1636d6860c'
}
const app = express();


app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Tron Api");
});


app.post("/trctokenbalance", async (req, res) => {
    const trc20ContractAddress = req.body.contractaddress;
    const address = req.body.accountaddress;

    if (trc20ContractAddress == null) {
        res.status(404).send("contract address is missing");
    } else if (address == null) {
        res.status(404).send("receiver wallet address is missing");
    }

    const tronWeb = new TronWeb({
        fullHost,
        headers
    });
    tronWeb.setAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');

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
        console.log(error);
        res.send(error);
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
        fullHost,
        headers
    });
    try{
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

    }catch(error){
        console.log(error)
         res.send(error)
    }

});

app.post("/sendtokentrc", async (req, res) => {
    const privateKey = req.headers.privatekey;
    const addressTo = req.body.receiver;
    const trc20ContractAddress = req.body.contractaddress;
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

    const tronWeb = new TronWeb({
        fullHost,
        headers,
        privateKey
    });
    try {
        const contractAddressHex = tronWeb.address.toHex(trc20ContractAddress);
        const contractInstance = await tronWeb.contract().at(contractAddressHex);
        const amount = amount_send * 1000000;
        const response = await contractInstance.transfer(addressTo, amount).send();
        console.log(response);
        res.send({
            transaction_hash: response,
        });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});


app.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});