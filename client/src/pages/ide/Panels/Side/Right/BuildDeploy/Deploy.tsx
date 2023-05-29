import { useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Text from "../../../../../../components/Text";
import Button, { ButtonProps } from "../../../../../../components/Button";
import { Skeleton } from "../../../../../../components/Loading";
import { ConnectionErrorText } from "../Common";
import { programAtom, terminalStateAtom } from "../../../../../../state";
import { PgCommand, PgProgramInfo, PgWallet } from "../../../../../../utils/pg";
import { useInitialLoading } from "..";
import { useConnect, useCurrentWallet } from "../../../../../../hooks";

// TODO: Cancel deployment
const Deploy = () => {
  const [terminalState] = useAtom(terminalStateAtom);
  const [program] = useAtom(programAtom);

  const { initialLoading, deployed, connError } = useInitialLoading();
  const { pgWallet, solWalletPk } = useCurrentWallet();
  const upgradable = PgProgramInfo.onChain?.upgradable;
  const authority = PgProgramInfo.onChain?.authority;
  const hasAuthority = authority?.equals(PgWallet.publicKey);

  const deployButtonText = useMemo(() => {
    let text;
    if (terminalState.deployLoading) {
      if (deployed) text = "Upgrading...";
      else text = "Deploying...";
    } else {
      if (deployed) text = "Upgrade";
      else text = "Deploy";
    }

    return text;
  }, [terminalState.deployLoading, deployed]);

  const deployButtonProps: ButtonProps = useMemo(
    () => ({
      kind: "primary",
      onClick: async () => await PgCommand.deploy.run(),
      disabled: terminalState.deployLoading || terminalState.buildLoading,
      btnLoading: terminalState.deployLoading,
    }),
    [terminalState.deployLoading, terminalState.buildLoading]
  );

  const hasProgramKp = PgProgramInfo.kp ? true : false;
  const hasUuid = PgProgramInfo.uuid ? true : false;
  const hasProgramPk = PgProgramInfo.pk ? true : false;

  // Custom(uploaded) program deploy
  if (program.buffer.length) {
    if (!pgWallet)
      return (
        <Wrapper>
          <Text>Deployment can only be done from Playground Wallet.</Text>
          <ConnectPgWalletButton />
        </Wrapper>
      );

    if (!deployed && !hasProgramKp)
      return (
        <Wrapper>
          <Text>
            <div>
              First deployment needs a keypair. You can import it from
              <Bold> Program credentials</Bold>.
            </div>
          </Text>
        </Wrapper>
      );

    if (upgradable === false)
      return (
        <Wrapper>
          <Text kind="warning">The program is not upgradable.</Text>
        </Wrapper>
      );

    if (hasAuthority === false)
      return (
        <Wrapper>
          <Text kind="warning">
            You don't have the authority to upgrade this program.
          </Text>
        </Wrapper>
      );

    if (solWalletPk)
      return (
        <Wrapper>
          <Text kind="warning">
            Please disconnect from Phantom Wallet. Deployment can only be done
            from Playground Wallet.
          </Text>
          <DisconnectSolWalletButton />
        </Wrapper>
      );

    let text = ` Ready to ${deployed ? "upgrade" : "deploy"} ${
      program.fileName
    }`;
    if (terminalState.deployLoading) {
      text = `${deployed ? "Upgrading" : "Deploying"} ${program.fileName}...`;
    }

    return (
      <Wrapper>
        <Text>{text}</Text>
        <Button {...deployButtonProps}>{deployButtonText}</Button>
      </Wrapper>
    );
  }

  // First time state
  if (!deployed && !hasProgramKp) return null;

  if (initialLoading)
    return (
      <Wrapper>
        <Skeleton height="2rem" />
      </Wrapper>
    );

  if (connError)
    return (
      <Wrapper>
        <ConnectionErrorText />
      </Wrapper>
    );

  // Normal deploy
  if (hasProgramPk) {
    if (!pgWallet)
      return (
        <Wrapper>
          <Text>Deployment can only be done from Playground Wallet.</Text>
          <ConnectPgWalletButton />
        </Wrapper>
      );

    if (terminalState.buildLoading)
      return (
        <Wrapper>
          <Button {...deployButtonProps}>{deployButtonText}</Button>
        </Wrapper>
      );

    if (!hasUuid)
      return (
        <Wrapper>
          <Text>
            <div>
              You need to build the project first or upload a program from
              <Bold> Upload a program</Bold>.
            </div>
          </Text>
        </Wrapper>
      );

    if (upgradable === false)
      return (
        <Wrapper>
          <Text kind="warning">The program is not upgradable.</Text>
        </Wrapper>
      );

    if (hasAuthority === false)
      return (
        <Wrapper>
          <Text kind="warning">
            You don't have the authority to upgrade this program.
          </Text>
        </Wrapper>
      );

    if (solWalletPk)
      return (
        <Wrapper>
          <Text kind="warning">
            Please disconnect from Phantom Wallet. Deployment can only be done
            from Playground Wallet.
          </Text>
          <DisconnectSolWalletButton />
        </Wrapper>
      );

    return (
      <Wrapper>
        <Button {...deployButtonProps}>{deployButtonText}</Button>
      </Wrapper>
    );
  }

  // Shouldn't come here
  return (
    <Wrapper>
      <Text kind="error">Something went wrong.</Text>
    </Wrapper>
  );
};

const ConnectPgWalletButton = () => {
  const { pgButtonStatus } = useConnect();

  const connect = useCallback(async () => await PgCommand.connect.run(), []);

  return (
    <Button onClick={connect} kind="primary">
      {pgButtonStatus}
    </Button>
  );
};

const DisconnectSolWalletButton = () => {
  const { solButtonStatus, handleConnect } = useConnect();

  return (
    <Button onClick={handleConnect} kind="outline">
      {solButtonStatus}
    </Button>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.default.border};

  & div:first-child + button {
    margin-top: 1.5rem;
  }
`;

const Bold = styled.span`
  font-weight: bold;
`;

export default Deploy;
