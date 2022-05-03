import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Grid, Zoom } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import "./minting.scss";
import { useWeb3Context } from "../../hooks";
import {
  IPendingTxn,
  isPendingTxn,
  txnButtonText,
} from "../../store/slices/pending-txns-slice";
import { IReduxState } from "../../store/slices/state.interface";
import { changeMint } from "src/store/slices/mint-thunk";
import leftImage from "../../assets/images/minus.png";
import rightImage from "../../assets/images/plus.png";

interface INftItemProps {
  nftItem: any;
}

function NftBox({ nftItem }: INftItemProps) {
  const video = useRef<HTMLVideoElement>(null);
  const playVideo = (event: any) => {
    video.current && video.current.play();
  };
  return (
    <div>
      <video
        ref={video}
        loop
        src={nftItem.image}
        style={{ width: 100, height: 100 }}
      />
    </div>
  );
}

function Minting() {
  const dispatch = useDispatch();
  const { provider, address, connect, chainID, checkWrongNetwork } =
    useWeb3Context();

  const [count, setCount] = useState(1);

  const pendingTransactions = useSelector<IReduxState, IPendingTxn[]>(
    (state) => {
      return state.pendingTransactions;
    }
  );

  const nfts = useSelector<IReduxState, string[]>((state) => {
    return state.nfts;
  });

  const accountLoading = useSelector<IReduxState, boolean>((state) => {
    return state.account.loading;
  });

  const onMint = async () => {
    if (await checkWrongNetwork()) return;
    await dispatch(
      changeMint({ address, count, provider, networkID: chainID })
    );
  };

  const onNext = () => {
    if (count < 20) {
      setCount(count + 1);
    }
  };
  const handleValue = (e: any) => {
    setCount(e.target.value);
  };

  const onPrevious = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  return (
    <>
      <div className="presale-view">
        <Zoom in={true}>
          <div className="presale-card">
            <Grid
              className="presale-card-grid"
              container
              direction="column"
              spacing={2}
            >
              <Grid item>
                <div className="presale-card-header">
                  <p
                    className="presale-card-header-title"
                    style={{ fontSize: "30px" }}
                  >
                    Creative NFT
                  </p>
                </div>
                <div className="presale-card-header">
                  <p
                    className="presale-card-header-title"
                    style={{ opacity: "0.5" }}
                  >
                    MAKE YOURS TODAY
                  </p>
                </div>
                <br />

                <Grid container>
                  <Grid item xs={2}></Grid>
                  <Grid item xs={3}>
                    <img
                      src={leftImage}
                      alt=""
                      style={{ width: "100%" }}
                      onClick={() => onPrevious()}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={2}
                    style={{ alignSelf: "center", textAlign: "center" }}
                  >
                    <input
                      type="number"
                      value={count}
                      style={{
                        width: "80%",
                        height: "4rem",
                        fontSize: "3.2rem",
                        textAlign: "center",
                      }}
                      onChange={handleValue}
                      min="1"
                      max="20"
                    ></input>
                  </Grid>
                  <Grid item xs={3}>
                    <img
                      src={rightImage}
                      alt=""
                      style={{ width: "100%" }}
                      onClick={() => onNext()}
                    />
                  </Grid>
                  <Grid item xs={2}></Grid>
                </Grid>

                <br />

                <Grid container>
                  <Grid item xs={12} sm={3}></Grid>
                  <Grid item xs={12} sm={6}>
                    {!address && (
                      <div className="mint-button" onClick={connect}>
                        <p>CONNECT WALLET</p>
                      </div>
                    )}
                    {address && (
                      <div
                        className="mint-button"
                        onClick={() => {
                          if (isPendingTxn(pendingTransactions, "minting"))
                            return;
                          onMint();
                        }}
                      >
                        <p>
                          {txnButtonText(
                            pendingTransactions,
                            "minting",
                            "Mint"
                          )}
                        </p>
                      </div>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </div>
        </Zoom>
      </div>

      <div className="presale-view">
        <Zoom in={true}>
          <div className="presale-card" style={{ minHeight: "auto" }}>
            <div className="presale-card-header">
              <p
                className="presale-card-header-title"
                style={{ fontSize: "30px" }}
              >
                YOUR NFTs
              </p>
            </div>
            <div className="avatars">
              {nfts.length > 0 ? (
                nfts.map((avatar, index) => (
                  <NftBox key={index} nftItem={avatar} />
                ))
              ) : accountLoading ? (
                <CircularProgress
                  size={120}
                  style={{ margin: "5em auto", color: "#fff" }}
                />
              ) : (
                <div style={{ margin: "6em auto" }}>
                  <h4>You have no NFTs</h4>
                </div>
              )}
            </div>
          </div>
        </Zoom>
      </div>
    </>
  );
}

export default Minting;
