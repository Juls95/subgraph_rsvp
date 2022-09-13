// test our smart contract locally before we deploy to a testnet so we can make sure it works as intended.
const hre = require("hardhat");

const main = async () => {
    // deploy the contract locally
    const rsvpContractFactory = await hre.ethers.getContractFactory("Web3RSVP");
    const rsvpContract = await rsvpContractFactory.deploy();
    await rsvpContract.deployed();
    console.log("Contract deployed to:", rsvpContract.address);
    
    // To get our deployer wallet address and a couple others for testing, we use the getSigners method.
    const [deployer, address1, address2] = await hre.ethers.getSigners();

    // define the event data we are going to use. You can use an IPFS CID we already created.
    let deposit = hre.ethers.utils.parseEther("1");
    let maxCapacity = 3;
    let timestamp = 1718926200;
    let eventDataCID =
    "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";

    // will return data about the transaction including an array of the emitted events which we can log to our console
    let txn = await rsvpContract.createNewEvent(
        timestamp,
        deposit,
        maxCapacity,
        eventDataCID
      );
      let wait = await txn.wait();
      console.log("NEW EVENT CREATED:", wait.events[0].event, wait.events[0].args);
      
      let eventID = wait.events[0].args.eventID;
      console.log("EVENT ID:", eventID);

    //To send our deposit, we can pass in an object as the last parameter with the value set to the deposit amount.

    txn = await rsvpContract.createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

    txn = await rsvpContract
    .connect(address1)
    .createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

    txn = await rsvpContract
    .connect(address2)
    .createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);
    
    // confirm all of the RSVP
    txn = await rsvpContract.confirmAllAttendees(eventID);
    wait = await txn.wait();
    wait.events.forEach((event) =>
      console.log("CONFIRMED:", event.args.attendeeAddress)
    );

    // wait 10 years simulating time to  withdrawing unclaimed deposits
    await hre.network.provider.send("evm_increaseTime", [15778800000000]);

    txn = await rsvpContract.withdrawUnclaimedDeposits(eventID);
    wait = await txn.wait();
    console.log("WITHDRAWN:", wait.events[0].event, wait.events[0].args);

};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
