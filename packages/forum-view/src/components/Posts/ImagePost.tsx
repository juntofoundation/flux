import { useContext, useEffect, useState } from "preact/hooks";
import { PerspectiveContext } from "utils/react";
import styles from "./index.scss";
import { formatRelative } from "date-fns/esm";
import { Profile } from "utils/types";
import { getImage } from "utils/helpers/getImage";
import { DisplayView } from "../../constants/options";

export default function ImagePost({ post, displayView }) {
  const {
    state: { members },
  } = useContext(PerspectiveContext);

  const [base64, setBase64] = useState("");

  async function fetchImage(url) {
    const image = await getImage(url);
    setBase64(image);
  }

  function onProfileClick(event: any, did: string) {
    const e = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    event.target.dispatchEvent(e);
  }

  useEffect(() => {
    if (post.image) {
      fetchImage(post.image);
    }
  }, [post.image]);

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";
  const displayStyle: DisplayView =
    displayView === DisplayView.Compact ? styles.compact : styles.grid;

  return (
    <div class={[styles.post, displayStyle, popularStyle].join(" ")}>
      <div class={styles.postImageWrapper}>
        {base64 && <img class={styles.postImage} src={base64} />}
      </div>
      <div class={styles.postContentWrapper}>
        <div className={styles.postTitle}>{post.title}</div>
        <div className={styles.postDetails}>
          Posted by
          <span
            className={styles.authorName}
            onClick={(e) => onProfileClick(e, author?.did)}
          >
            {author?.username || (
              <j-skeleton width="lg" height="text"></j-skeleton>
            )}
          </span>
          <span class={styles.timestamp}>
            {formatRelative(new Date(post.timestamp), new Date())}
          </span>
        </div>
      </div>
    </div>
  );
}
