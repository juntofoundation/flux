import { useEffect, useState } from "preact/hooks";
import useWebRTC from "../../hooks/useWebrtc";
import getMe, { Me } from "utils/api/getMe";

import UserGrid from "../UserGrid";
import Footer from "../Footer";

import styles from "./Channel.module.css";
import Debug from "../Debug";

export default function Channel({ source, uuid }) {
  const [showDebug, setShowDebug] = useState(false);
  const [agent, setAgent] = useState<Me | null>(null);

  const {
    connections,
    hasJoined,
    localStream,
    onToggleCamera,
    onJoin,
    onLeave,
  } = useWebRTC({
    source,
    uuid,
  });

  // Get agent/me
  useEffect(() => {
    async function fetchAgent() {
      const agent = await getMe();
      setAgent(agent);
    }

    if (!agent) {
      fetchAgent();
    }
  }, [agent]);

  return (
    <section className={styles.outer}>
      {!hasJoined && (
        <div className={styles.join}>
          <h1>You haven't joined this room</h1>
          <p>Your video will be on by default.</p>
          <j-button variant="primary" size="lg" onClick={onJoin}>
            Join room!
          </j-button>
        </div>
      )}

      <UserGrid
        currentUser={agent}
        localStream={localStream}
        peers={connections}
      />

      <>{showDebug && <Debug connections={connections} />}</>

      <Footer
        hasJoined={hasJoined}
        onToggleCamera={onToggleCamera}
        onToggleDebug={() => setShowDebug(!showDebug)}
        onLeave={onLeave}
      />
    </section>
  );
}