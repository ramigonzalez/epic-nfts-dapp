import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import myEpicNft from "./utils/MyEpicNFT.json";

const TWITTER_HANDLE = "ramirogc21";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0x53f42B5BD1Dac8609d4AC92D427611127760558f";
const OPENSEA_LINK = `https://testnets.opensea.io/assets/goerli/${CONTRACT_ADDRESS}`;
const TOTAL_MINT_COUNT = 50;
const GOERLI_CHAIN_ID = "0x5";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [mintedAmount, setMintedAmount] = useState(0);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [mineLoading, setMineLoading] = useState(false);

  const checkChainId = async (ethereum) => {
    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Conectado à rede " + chainId);
    return chainId === GOERLI_CHAIN_ID;
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Certifique-se que você tem a MetaMask instalada!");
      return;
    } else {
      console.log("Temos o objeto ethereum!", ethereum);
    }
    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);

      const isGoerli = await checkChainId(ethereum);
      if (!isGoerli) alert("Você não está conectado a rede Goerli de teste!");
      setIsWrongNetwork(!isGoerli);

      setCurrentAccount(account);

      setupEventListener();
      getCurrentTokenId();
    } else {
      console.log("No authorized account found");
    }
  };
  /*
   * Implemente seu método connectWallet aqui
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Baixe a MetaMask!");
        return;
      }
      /*
       * Método chique para pedir acesso a conta.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      /*
       * Boom! Isso deve escrever o endereço público uma vez que autorizar a MetaMask.
       */
      console.log("Conectado", accounts[0]);

      const isGoerli = await checkChainId(ethereum);
      if (!isGoerli) alert("Você não está conectado a rede Goerli de teste!");
      setIsWrongNetwork(!isGoerli);

      setCurrentAccount(accounts[0]);

      setupEventListener();
      getCurrentTokenId();
    } catch (error) {
      console.log(error);
    }
  };

  // Setup do listener.
  const setupEventListener = async () => {
    // é bem parecido com a função
    try {
      const { ethereum } = window;

      if (ethereum) {
        // mesma coisa de novo
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // Aqui está o tempero mágico.
        // Isso essencialmente captura nosso evento quando o contrato lança
        // Se você está familiar com webhooks, é bem parecido!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `Olá pessoal! Já cunhamos seu NFT. Pode ser que esteja branco agora. Demora no máximo 10 minutos para aparecer no OpenSea. Aqui está o link: <https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}>`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Objeto ethereum não existe!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Vai abrir a carteira agora para pagar o gás...");
        setMineLoading(true);

        let nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Cunhando...espere por favor.");
        await nftTxn.wait();
        setMineLoading(false);

        console.log(
          `Cunhado, veja a transação: https://sepolia.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Objeto ethereum não existe!");
      }
    } catch (error) {
      console.log(error);
      setMineLoading(false);
    }
  };

  const getCurrentTokenId = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        const totalMintedAmount = await connectedContract.getCurrentTokenId();
        console.log("getCurrentTokenId", totalMintedAmount.toNumber());
        setMintedAmount(totalMintedAmount.toNumber());
      } else {
        console.log("Objeto ethereum não existe!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Métodos para Renderizar
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Conectar Carteira
    </button>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  /*
   * Adicionei um render condicional! Nós não queremos mostrar o Connect to Wallet se já estivermos conectados
   */
  return (
    <div className="App">
      <div className="container">
        {isWrongNetwork && (
          <div className="top warning">Only Goerli network is supported</div>
        )}
        <div className="header-container">
          <p className="header gradient-text">Minha Coleção NFT</p>
          <p className="sub-text">Únicas. Lindas. Descubra a sua NFT hoje.</p>

          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <>
              <p className="sub-text">
                {mintedAmount}/{TOTAL_MINT_COUNT}
              </p>

              <div className="">
                {!mineLoading ? (
                  <button
                    disabled={isWrongNetwork}
                    onClick={askContractToMintNft}
                    className="cta-button connect-wallet-button"
                  >
                    Cunhar NFT
                  </button>
                ) : (
                  <div className="btnContainer">
                    <div className="loading"></div>
                  </div>
                )}
              </div>
            </>
          )}
          <br></br>
          <a href={OPENSEA_LINK}>
            <button className="cta-button connect-wallet-button">
              See all collection in OpenSea
            </button>
          </a>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`feito com ❤️ por @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};
export default App;
