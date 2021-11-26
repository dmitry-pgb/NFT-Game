import React, {useEffect, useState} from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import SelectCharacter from './Components/SelectCharacter';
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import myEpicGame from './utils/MyEpicGame.json';
import { ethers } from 'ethers';
import Arena from './Components/Arena';
import LoadingIndicator from './Components/LoadingIndicator';


// Constants
const TWITTER_HANDLE = 'itsheizal';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {

   //Just a state variable we use to store our user's public wallet. Don't forget to import useState.
  const [currentAccount, setCurrentAccount] = useState(null);

  // new state property
  const [characterNFT, setCharacterNFT] = useState(null);

  // state for laoding indicator
  const [isLoading, setIsLoading] = useState(false);




   // Since this method will take some time, make sure to declare it as async 
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window; // checking if user is connected to metamask

      if (!ethereum) {
        console.log('Make sure you have MetaMask!');

        //set isLoading here
        setIsLoading(false);
        return;
      } else {
        console.log('We have the ethereum object', ethereum);

        //Check if we're authorized to access the user's wallet        
        const accounts = await ethereum.request({ method: 'eth_accounts' });

        //User can have multiple authorized accounts, we grab the first one if its there!
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log('Found an authorized account:', account);
          setCurrentAccount(account);
        } else {
          console.log('No authorized account found');
        }
      }
    } catch (error) {
      console.log(error);
    }

    //we release the state property after the function logic above
    setIsLoading(false);
  };

  // Render Methods
  const renderContent = () => {
    // if app is loading, render the loadingindicator

    if(isLoading){
      return <LoadingIndicator/>
    }

    // Scenario #1
    if (!currentAccount) {
      return (
        <div className="connect-wallet-container">
          <img
            src="https://media0.giphy.com/media/nEISDuN1BqtgB39Xee/200w.webp?cid=ecf05e478ps8mkl5igroxvrjw62bkrwn3mlr58ml64qjo5rp&rid=200w.webp&ct=g"
            alt="Monty Python Gif"
          />
          <button
            className="cta-button connect-wallet-button"
            onClick={connectWalletAction}
          >
            Connect Wallet To Get Started
          </button>
        </div>
      );
      //Scenario #2
    } else if (currentAccount && !characterNFT) {
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />;
    } else if (currentAccount && characterNFT) {
      return <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} />;
    }
  };

  // implement connectwallet method here
  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      // Fancy method to request access to account.
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      //Boom! This should print out public address once we authorize Metamask.
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {
    setIsLoading(true);
    checkIfWalletIsConnected();
  }, []);

  useEffect(()=>{
    // The function we will call that interacts with out smart contract
    const fetchNFTMetadata = async () => {
      console.log('Checking for Character NFT on address:', currentAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );

      const characterNFT = await gameContract.checkIfUserHasNFT();
      if (characterNFT.name) {
        console.log('User has character NFT');
        setCharacterNFT(transformCharacterData(characterNFT));
      }

      // once its done loading, set loading to false
      setIsLoading(false);
    };

    // We only want to run this, if we have a connected wallet
    if (currentAccount) {
      console.log('CurrentAccount:', currentAccount);
      fetchNFTMetadata();
    }

  }, [currentAccount])

  

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">⚔️ Metaverse Slayer ⚔️</p>
          <p className="sub-text">Team up to protect the Metaverse!</p>
            {/*
             * Button that we will use to trigger wallet connect
             * Don't forget to add the onClick event to call your method!
             */}
            {renderContent()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
