import React, { useContext, useEffect, useState } from 'react';
import ApolloClient from 'apollo-boost';
import { useQuery } from '@apollo/react-hooks';

import { GET_TRANSMUTATION } from '../../../utils/Queries';
import ErrorMessage from '../../../components/shared/ErrorMessage';
import Loading from '../../../components/shared/Loading';
import TransmutationForm from '../../../components/proposal-v2/TransmutationForm';
import {
  DaoDataContext,
  CurrentUserContext,
  BoostContext,
  DaoServiceContext,
} from '../../../contexts/Store';
import { TransmutationService } from '../../../utils/TransmutationService';
import { useLocation } from 'react-router-dom';
import TransmutationStats from '../../../components/stats/TransmutationStats';
import supportedChains from '../../../utils/chains';

const chainData = supportedChains[+process.env.REACT_APP_NETWORK_ID];
const transClient = new ApolloClient({
  uri: chainData.transmutation_subgraph_url,
});

const Transmutation = () => {
  const location = useLocation();
  const [daoData] = useContext(DaoDataContext);
  const [daoService] = useContext(DaoServiceContext);
  const [currentUser] = useContext(CurrentUserContext);
  const [boosts] = useContext(BoostContext);

  const [transmutationService, setTransmutationService] = useState();

  const options = {
    client: transClient,
    variables: { contractAddr: daoData.contractAddress },
  };

  const { loading, error, data } = useQuery(GET_TRANSMUTATION, options);

  useEffect(() => {
    const setService = async () => {
      const setupValues = {
        ...boosts.transmutation.metadata,
        ...data.transmutations[0],
      };
      const service = new TransmutationService(
        daoService.web3,
        currentUser?.username,
        setupValues,
      );

      setTransmutationService(service);
    };

    if (data && data.transmutations[0]) {
      setService();
    }

    // eslint-disable-next-line
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const renderTrans = () => {
    switch (location.pathname.split('/')[3]) {
      case 'proposal-transmutation': {
        return (
          <TransmutationForm transmutationService={transmutationService} />
        );
      }
      case 'stats-transmutation': {
        return (
          <TransmutationStats transmutationService={transmutationService} />
        );
      }
      default: {
        return null;
      }
    }
  };

  return <>{transmutationService ? <>{renderTrans()}</> : null}</>;
};

export default Transmutation;
