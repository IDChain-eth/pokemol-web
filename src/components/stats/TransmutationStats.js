import React, { useContext } from 'react';
import { useQuery } from '@apollo/react-hooks';

import { Box, Flex } from 'rebass';

import styled from 'styled-components';

import { DaoServiceContext } from '../../contexts/Store';
import { GET_MOLOCH } from '../../utils/Queries';
import BottomNav from '../shared/BottomNav';
import ErrorMessage from '../shared/ErrorMessage';
import Loading from '../shared/Loading';
import { ViewDiv, PadDiv } from '../../App.styles';
import LootGrab from './LootGrab';
import LootShareDistro from './LootSharesDistro';
import TokenInfo from './TokenInfo';
import TransmutationStatus from './TransmutationStatus';

const StyledBox = styled(Box)`
  border: 1px solid ${(props) => props.theme.baseFontColor};
  padding: 25px;
`;

const PIECOLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const TransmutationStats = (props) => {
  const { transmutationService } = props;
  const [daoService] = useContext(DaoServiceContext);

  const { loading, error, data } = useQuery(GET_MOLOCH, {
    variables: { contractAddr: daoService.daoAddress.toLowerCase() },
  });

  const getTokenInfo = async (name, tokenAddress) => {
    const totalSupply = await daoService.token.totalSupply(tokenAddress);
    const transSupply = await daoService.token.balanceOf(
      transmutationService.setupValues.transmutation,
      'latest',
      tokenAddress,
    );
    const trustSupply = await daoService.token.balanceOf(
      transmutationService.setupValues.trust,
      'latest',
      tokenAddress,
    );
    const minionSupply = await daoService.token.balanceOf(
      transmutationService.setupValues.minion,
      'latest',
      tokenAddress,
    );
    const daoSupply = await daoService.token.balanceOf(
      transmutationService.setupValues.moloch,
      'latest',
      tokenAddress,
    );
    return {
      tokenAddress: tokenAddress,
      totalSupply,
      transSupply,
      trustSupply,
      minionSupply,
      daoSupply,
      name,
    };
  };

  const getRequestToken = (data, tokenAddress) => {
    const token = data.moloch.tokenBalances
      .sort((a, b) => {
        return +b.tokenBalance - a.tokenBalance;
      })
      .find(
        (token) =>
          token.token.tokenAddress.toLowerCase() === tokenAddress.toLowerCase(),
      );
    return token;
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ViewDiv>
      <PadDiv>
        <h2>Transmutation Stats</h2>

        <Flex>
          <StyledBox width={1 / 2} mx={5}>
            <TokenInfo
              setupValues={transmutationService.setupValues}
              PIECOLORS={PIECOLORS}
              getTokenInfo={getTokenInfo}
            />
            <LootShareDistro data={data} PIECOLORS={PIECOLORS} />
          </StyledBox>
          <StyledBox width={1 / 2} mx={5}>
            <TransmutationStatus
              setupValues={transmutationService.setupValues}
              PIECOLORS={PIECOLORS}
              getTokenInfo={getTokenInfo}
            />
            <LootGrab
              data={data}
              setupValues={transmutationService.setupValues}
              getRequestToken={getRequestToken}
            />
          </StyledBox>
        </Flex>

        <BottomNav />
      </PadDiv>
    </ViewDiv>
  );
};

export default TransmutationStats;
