import React, { useContext, useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import _ from 'lodash';

import ProposalFilter from '../../components/proposal/ProposalFilter';
import ErrorMessage from '../../components/shared/ErrorMessage';
import BottomNav from '../../components/shared/BottomNav';
import Loading from '../../components/shared/Loading';
import {
  CurrentWalletContext,
  DaoServiceContext,
  DaoDataContext,
  CurrentUserContext,
} from '../../contexts/Store';
import ProposalTypeToggle from '../../components/proposal-v2/ProposalTypeToggle';

import styled from 'styled-components';
import { RowDiv, ButtonLink } from '../../App.styles';
import { GET_PROPOSALS_LIST } from '../../utils/Queries';

const ProposalsHeaderRow = styled(RowDiv)`
  padding-left: 25px;
  padding-right: 25px;
`;

const NewProposalButton = styled(ButtonLink)``;

const Proposals = ({ match, history }) => {
  const [currentWallet] = useContext(CurrentWalletContext);
  const [currentUser] = useContext(CurrentUserContext);
  const [daoService] = useContext(DaoServiceContext);
  const [daoData] = useContext(DaoDataContext);
  const [proposals, setProposals] = useState([]);
  const [sponsored, setSponsored] = useState(true);
  const [fetched, setFetched] = useState(false);

  const options = {
    variables: { contractAddr: daoService.daoAddress.toLowerCase() },
    pollInterval: 60000,
    fetchPolicy: 'network-only',
    // fetchPolicy: 'cache-only',
  };

  const { loading, error, data, fetchMore } = useQuery(
    GET_PROPOSALS_LIST,
    options,
  );

  useEffect(() => {
    if (data && data.proposals && fetched) {
      if (+daoData.version === 2) {
        const filteredProposals = data.proposals.filter(
          (prop) => prop.sponsored === sponsored,
        );
        setProposals(filteredProposals);
      } else {
        setProposals(data.proposals);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sponsored, fetched]);

  useEffect(() => {
    const fetch = async () => {
      try {
        fetchMore({
          variables: { skip: data.proposals.length },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult.proposals.length) {
              setFetched(true);
              return;
            }
            return Object.assign({}, prev, {
              proposals: _.uniqBy(
                [...prev.proposals, ...fetchMoreResult.proposals],
                'id',
              ),
            });
          },
        });
      } catch (err) {
        console.log('err', err);
      }
    };

    if (data) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const canSubmitProposal =
    daoData.version === 1
      ? fetched && currentWallet.shares > 0
      : fetched && currentUser;

  return (
    <>
      <ProposalsHeaderRow>
        <h3>Proposals</h3>
        {canSubmitProposal ? (
          <NewProposalButton
            to={
              daoData.version === 2
                ? `/dao/${daoService.daoAddress}/proposal-engine`
                : `/dao/${daoService.daoAddress}/proposal-new`
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              style={{ marginRight: '5px' }}
            >
              <path fill="none" d="M0 0h24v24H0V0z" />
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            New Proposal
          </NewProposalButton>
        ) : null}
      </ProposalsHeaderRow>
      {+daoData.version === 2 ? (
        <ProposalTypeToggle
          handleTypeChange={setSponsored}
          sponsored={sponsored}
        />
      ) : null}

      <ProposalFilter
        proposals={proposals}
        filter={match.params.filter || 'na'}
        history={history}
        unsponsoredView={!sponsored}
      />
      <BottomNav />
    </>
  );
};

export default Proposals;
