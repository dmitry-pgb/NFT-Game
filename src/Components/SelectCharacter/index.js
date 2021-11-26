import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import LoadingIndicator from '../LoadingIndicator';


const SelectCharacter = ({ setCharacterNFT }) => {
    const [characters, setCharacters] = useState([]);
    const [gameContract, setGameContract] = useState(null);

    //new minting state property
    const [mintingCharacter, setMintingCharacter] = useState(false);

    // Actions
    const mintCharacterNFTAction = (characterId) => async () => {
        try {
        if (gameContract) {
            // show loading indicator when minting is happening
            setMintingCharacter(true);

            console.log('Minting character in progress...');
            const mintTxn = await gameContract.mintCharacterNFT(characterId);
            await mintTxn.wait();
            console.log('mintTxn:', mintTxn);

            // hide the loading indicator when minting is done
            setMintingCharacter(false);
        }
        } catch (error) {
            console.warn('MintCharacterAction Error:', error);

            // if there is an error hide the loading indicator too
            setMintingCharacter(false);
        }
    };

    // UseEffect
    useEffect(() => {
        const { ethereum } = window;
    
        if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const gameContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            myEpicGame.abi,
            signer
        );
    
        //This is the big difference. Set our gameContract in state.
        setGameContract(gameContract);
        } else {
            console.log('Ethereum object not found');
        }
    }, []);

    useEffect(() => {
        const getCharacters = async () => {
            try {
                console.log('Getting contract characters to mint');
        
                /*Call contract to get all mint-able characters
                */
                const charactersTxn = await gameContract.getAllDefaultCharacters();
                console.log('charactersTxn:', charactersTxn);
        
                /*Go through all of our characters and transform the data
                */
                const characters = charactersTxn.map((characterData) =>
                transformCharacterData(characterData)
                );
        
                /*Set all mint-able characters in state
                */
                setCharacters(characters);
            } catch (error) {
                console.error('Something went wrong fetching characters:', error);
            }
        };

        // Add a callback method that will fire when this event is received
        const onCharacterMint = async (sender, tokenId, characterIndex) => {
            console.log(
            `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
            );

            /*
            Once our character NFT is minted we can fetch the metadata from our contract
            and set it in state to move onto the Arena
            */
            if (gameContract) {
            const characterNFT = await gameContract.checkIfUserHasNFT();
            console.log('CharacterNFT: ', characterNFT);
            setCharacterNFT(transformCharacterData(characterNFT));
            }
            alert(`Your NFT is all done -- see it here: https://testnets.opensea.io/assets/${gameContract}/${tokenId.toNumber()}`)
        };
    
        /*
        If our gameContract is ready, let's get characters!
        */
        if (gameContract) {
            getCharacters();
            /*
            Setup NFT Minted Listener
            */
            gameContract.on('CharacterNFTMinted', onCharacterMint);
        }

        return () => {
            /*
            When your component unmounts, let;s make sure to clean up this listener
            */
            if (gameContract) {
                gameContract.off('CharacterNFTMinted', onCharacterMint);
            }
        };
    }, [gameContract]);

    // Render Methods
    const renderCharacters = () =>
    characters.map((character, index) => (
    <div className="character-item" key={character.name}>
        <div className="name-container">
        <p>{character.name}</p>
        </div>
        <img src={character.imageURI} alt={character.name} />
        <button
        type="button"
        className="character-mint-button"
        onClick={mintCharacterNFTAction(index)}
        >{`Mint ${character.name}`}</button>
    </div>
    ));

    return (
        <div className="select-character-container">
        <h2>Mint Your Hero. Choose wisely.</h2>
        {/* Only show this when there are characters in state */}
        {characters.length > 0 && (
            <div className="character-grid">{renderCharacters()}</div>
        )}
        {/* Only show our loading state if mintingCharacter is true */}
        {mintingCharacter && (
        <div className="loading">
            <div className="indicator">
            <LoadingIndicator />
            <p>Minting In Progress...</p>
            </div>
            <img
            src="https://media0.giphy.com/media/32RnqZkHVC2Fr2QTj8/200w.webp?cid=ecf05e47a95gui0ck2w2z761jm1gnarko0iqg60u1uaj8bbr&rid=200w.webp&ct=g"
            alt="Minting loading indicator"
            />
        </div>
        )}
        </div>
    );
};

export default SelectCharacter;