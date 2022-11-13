import { useContext, useEffect, useState } from "preact/hooks";
import MessageItem from "../MessageItem";
import Header from "../Header";
import "react-hint/css/index.css";
import getPosts from "utils/api/getPosts";
import { checkUpdateSDNAVersion } from "utils/api/updateSDNA";

export default function MessageList({ perspectiveUuid, mainRef, channelId }) {
  const [posts, setPosts] = useState([]);

  async function loadMoreMessages(source: string, fromDate?: Date) {
    let posts;
    try {
      posts = await getPosts(perspectiveUuid, source, fromDate);
    } catch (e) {
      if (e.message.includes("existence_error")) {
        console.error("We dont have the SDNA to make this query, please wait for community to sync");
        checkUpdateSDNAVersion(perspectiveUuid, new Date());
        throw(e);
      } else {
        throw (e)
      }
    }
    setPosts(posts);
    if (posts.length > 0) {
      checkUpdateSDNAVersion(perspectiveUuid, posts[0].timestamp);
    }
  }

  useEffect(() => {
    if (channelId && perspectiveUuid) {
      loadMoreMessages(channelId);
    }
  }, [channelId, perspectiveUuid]);

  return (
    <div style={{ overflowY: "auto" }}>
      <Header></Header>
      {posts.map((post) => {
        return (
          <MessageItem
            key={post.id}
            message={post}
            mainRef={mainRef}
            perspectiveUuid={perspectiveUuid}
          />
        );
      })}
      <j-flex a="center" j="center">
        <j-button variant="link" onClick={() => loadMoreMessages(channelId)}>
          Load more
        </j-button>
      </j-flex>
    </div>
  );
}
