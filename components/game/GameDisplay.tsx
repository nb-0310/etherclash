import React from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

import { ContractReadResponse, GameState } from '@/types';
import ExplorerLink from '../common/ExplorerLink';
import ConnectWalletButton from '../common/ConnectWalletButton';
import getGameStatusText from '@/utils/getGameStatusText';
import Player1GameDisplay from './Player1GameDisplay';
import Player2GameDisplay from './Player2GameDisplay';
import getTimeLeft from '@/utils/getTimeLeft';

type GameDisplayProps = {
  gameData: Array<ContractReadResponse>;
  gameContract: `0x${string}`;
  refetch: () => void;
};

const GameDisplay: React.FC<GameDisplayProps> = ({
  gameData,
  gameContract,
  refetch,
}) => {
  const { address } = useAccount();
  const [
    stake,
    player1,
    player2,
    player1MoveHash,
    player2Move,
    timeout,
    lastAction,
  ] = gameData;
  const isCurrentUserPlayer1 = address === player1.result;
  const isCurrentUserPlayer2 = address === player2.result;
  const gameState: GameState = React.useMemo(() => {
    const hasGameTimedOut =
      getTimeLeft(timeout.result as number, lastAction.result as number) <= 0;

    const hasPlayer1Revealed = Boolean(player2Move.result) && stake.result == 0;
    const canPlayer1ClaimStake =
      hasGameTimedOut &&
      (stake.result as number) > 0 &&
      !Boolean(player2Move.result);
    const canPlayer2ClaimStake =
      hasGameTimedOut &&
      (stake.result as number) > 0 &&
      Boolean(player2Move.result) &&
      !hasPlayer1Revealed;
    const hasPlayer1ClaimedStake =
      hasGameTimedOut && stake.result == 0 && !Boolean(player2Move.result);
    const hasPlayer2ClaimedStake =
      hasGameTimedOut &&
      stake.result == 0 &&
      Boolean(player2Move.result) &&
      !hasPlayer1Revealed;

    return {
      hasPlayer2Moved: Boolean(player2Move.result) ? true : false,
      hasPlayer1Revealed,
      hasGameTimedOut: hasGameTimedOut,
      canPlayer1ClaimStake,
      canPlayer2ClaimStake,
      hasPlayer1ClaimedStake,
      hasPlayer2ClaimedStake,
    };
  }, [stake, player2Move, timeout, lastAction]);

  const getStakedAmountText = () => {
    const stakeAmount = formatEther(BigInt(stake?.result as number)).toString();
    if (!isCurrentUserPlayer1 && !isCurrentUserPlayer2) {
      return `${stakeAmount} ETH at stake`;
    } else if (isCurrentUserPlayer1) {
      return `${stakeAmount} ETH staked by you`;
    } else if (isCurrentUserPlayer2) {
      return `${stakeAmount} ETH stake required to play`;
    }
  };

  return (
    <div className="p-8 w-2/3 mx-auto bg-gray-400 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10 border border-gray-100 text-slate-700">
      <div className="flex items-center w-full justify-between">
        <h1 className="text-lg font-semibold ">
          {getGameStatusText(gameState)}
        </h1>
        {!gameState.hasPlayer1Revealed && (
          <h2 className="text-lg font-semibold">
            {(gameState.hasPlayer1ClaimedStake ||
              gameState.hasPlayer2ClaimedStake) &&
            stake?.result == 0
              ? `Stake claimed by ${
                  gameState.hasPlayer1ClaimedStake ? 'Player 1' : 'Player 2'
                }`
              : getStakedAmountText()}
          </h2>
        )}
      </div>
      <div>
        <span>Game: </span>
        <p>
          <ExplorerLink hashOrAddress={gameContract} isAddress></ExplorerLink>
        </p>
      </div>

      {!address && (
        <div className="flex flex-col items-center justify-center text-sm my-6 space-y-2">
          <span>Connect Wallet</span>
          <ConnectWalletButton />
        </div>
      )}
      {isCurrentUserPlayer1 && (
        <Player1GameDisplay
          gameContract={gameContract}
          player2Move={player2Move.result as number}
          timeout={timeout.result as number}
          lastAction={lastAction.result as number}
          gameState={gameState}
          refetch={refetch}
          player2={player2.result as string}
        />
      )}
      {isCurrentUserPlayer2 && (
        <Player2GameDisplay
          gameContract={gameContract}
          player2Move={player2Move.result as number}
          timeout={timeout.result as number}
          lastAction={lastAction.result as number}
          gameState={gameState}
          refetch={refetch}
          stake={stake.result as bigint}
          player1={player1.result as string}
        />
      )}
    </div>
  );
};

export default GameDisplay;