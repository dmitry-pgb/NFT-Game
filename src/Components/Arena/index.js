import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';
import LoadingIndicator from '../LoadingIndicator';

    /*
    We pass in our characterNFT metadata so we can a cool card in our UI
    */
const Arena = ({ characterNFT, setCharacterNFT }) => {

    // State
    const [gameContract, setGameContract] = useState(null);
    // State that will hold the boss metadata
    const [boss, setBoss] = useState(null);

    // use this for animations during attacks
    const [attackState, setAttackState] = useState('');

    // Toast state
    const [showToast, setShowToast] = useState(false);

    // Actions
    const runAttackAction = async () => {
        try {
            if (gameContract) {
                setAttackState('attacking');
                console.log('Attacking boss...');
                const attackTxn = await gameContract.attackBoss();
                await attackTxn.wait();
                console.log('attackTxn:', attackTxn);
                setAttackState('hit');

                //set toast to true then false 5 seconds later
                setShowToast(true);
                setTimeout(() => { //waits 5 seconds then removes the show class
                    setShowToast(false);
                }, 5000);
            }
            } catch (error) {
            console.error('Error attacking boss:', error);
            setAttackState('');
            }
    };

    // UseEffects
    useEffect(() => {
        /*
        Setup async function that will get the boss from our contract and sets in state
        */
        const fetchBoss = async () => {
        const bossTxn = await gameContract.getBigBoss();
        console.log('Boss:', bossTxn);
        setBoss(transformCharacterData(bossTxn));
        };

        //Set up logic when event is fired
        const onAttackComplete = (newBossHp, newPlayerHp) => {
            const bossHp = newBossHp.toNumber();
            const playerHp = newPlayerHp.toNumber();

            console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

            //update both player and boss hp
            setBoss((prevState) => {
                return { ...prevState, hp: bossHp };
            });

            setCharacterNFT((prevState) => {
                return { ...prevState, hp: playerHp };
            });
        };
    
        if (gameContract) {
        fetchBoss();
        gameContract.on('AttackComplete', onAttackComplete);
        }

        return () => {
            if (gameContract) {
                gameContract.off('AttackComplete', onAttackComplete);
            }
        }
    }, [gameContract]);

    // UseEffects
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

        setGameContract(gameContract);
        } else {
        console.log('Ethereum object not found');
        }
    }, []);

    return (
        <div className="arena-container">
        {/* Toast HTML right here */}
        {boss && characterNFT && (
        <div id="toast" className={showToast ? 'show' : ''}>
            <div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
        </div>
        )} 

        {/* Boss  */}
        {boss && (
            <div className="boss-container">
            <div className={`boss-content ${attackState}`} >
                <h2>🔥 {boss.name} 🔥</h2>
                <div className="image-content">
                <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
                <div className="health-bar">
                    <progress value={boss.hp} max={boss.maxHp} />
                    <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
                </div>
                </div>
            </div>
            <div className="attack-container">
                <button className="cta-button" onClick={runAttackAction}>
                {`💥 Attack ${boss.name}`}
                </button>
            </div>
            {/* Add this right under your attack button */}
            {attackState === 'attacking' && (
                <div className="loading-indicator">
                <LoadingIndicator />
                <p>Attacking ⚔️</p>
                </div>
            )}
            </div>
        )}   
        {/* Character NFT */}
        {characterNFT && (
        <div className="players-container">
            <div className="player-container">
            <h2 className="character">Your Character</h2>
            <div className="player">
                <div className="image-content">
                <h2>{characterNFT.name}</h2>
                <img
                    src={characterNFT.imageURI}
                    alt={`Character ${characterNFT.name}`}
                />
                <div className="health-bar">
                    <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                    <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
                </div>
                <div className="stats">
                <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
                </div>
            </div>
            </div>
            {/* <div className="active-players">
            <h2>Active Players</h2>
            <div className="players-list">{renderActivePlayersList()}</div>
            </div> */}
        </div>
        )}
        </div>
    );
};

export default Arena;