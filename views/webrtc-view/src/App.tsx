import { CommunityProvider, AgentProvider } from "utils/react";
import AllCommunities from "./components/AllCommunities";
import { WebRTCProvider } from "./context/WebRTCContext";
import Channel from "./components/Channel";

import styles from "./App.module.css";

export default function App({ perspective, source }) {
  return (
    <div>
      {perspective ? (
        <AgentProvider>
          <CommunityProvider perspectiveUuid={perspective}>
            <WebRTCProvider>
              <Channel source={source} uuid={perspective} />
            </WebRTCProvider>
          </CommunityProvider>
        </AgentProvider>
      ) : (
        <div className={styles.appContainer}>
          <AllCommunities />
        </div>
      )}
    </div>
  );
}
