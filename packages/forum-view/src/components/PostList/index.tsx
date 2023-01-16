import { useContext, useMemo, useState } from "preact/hooks";
import PostItem from "../PostItem";
import style from "./index.module.css";
import { DisplayView, displayOptions } from "../../constants/options";
import { ChannelContext, useEntries } from "utils/react";
import PostModel from "utils/api/post";

export default function PostList() {
  const { state } = useContext(ChannelContext);
  const [view, setView] = useState(DisplayView.Compact);

  const { entries: posts, loading } = useEntries({
    perspectiveUuid: state.communityId,
    source: state.channelId,
    model: PostModel,
  });

  const sortedPosts = useMemo(
    () => posts.sort((a, b) => b.timestamp - a.timestamp),
    [posts.length]
  );

  const displayStyle: DisplayView =
    view === DisplayView.Compact
      ? style.compact
      : view === DisplayView.Grid
      ? style.grid
      : style.card;
  const currentOption = displayOptions.find((o) => o.value === view);

  return (
    <div className={style.messageList}>
      <j-box pb="500">
        <j-flex a="center">
          <j-popover>
            <j-button variant="ghost" slot="trigger">
              <j-icon size="sm" name={currentOption.icon}></j-icon>
              <j-icon size="xs" name="chevron-down"></j-icon>
            </j-button>
            <j-menu slot="content">
              {displayOptions.map((option) => {
                return (
                  <j-menu-item
                    selected={option.value === view}
                    onClick={() => setView(option.value)}
                  >
                    <j-icon size="sm" slot="start" name={option.icon}></j-icon>
                    {option.label}
                  </j-menu-item>
                );
              })}
            </j-menu>
          </j-popover>
        </j-flex>
      </j-box>
      {loading && (
        <j-box py="500">
          <j-flex a="center" j="center">
            <j-spinner size="lg"></j-spinner>
          </j-flex>
        </j-box>
      )}
      {!loading && sortedPosts.length === 0 && (
        <j-box py="800">
          <j-flex gap="400" direction="column" a="center" j="center">
            <j-icon color="ui-500" size="xl" name="binoculars"></j-icon>
            <j-flex direction="column" a="center">
              <j-text nomargin color="black" size="700" weight="800">
                No posts yet
              </j-text>
              <j-text size="400" weight="400">
                Be the first to make one!
              </j-text>
            </j-flex>
          </j-flex>
        </j-box>
      )}
      <div className={[style.posts, displayStyle].join(" ")}>
        {sortedPosts.map((post) => (
          <PostItem post={post} displayView={view}></PostItem>
        ))}
      </div>
    </div>
  );
}
