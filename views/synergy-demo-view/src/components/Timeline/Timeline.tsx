import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message, Post } from "@coasys/flux-api";
import { findRelationships, processItem } from "@coasys/flux-utils";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import TimelineItem from "../TimelineItem";
import { transformItem } from "./../../utils";
import styles from "./Timeline.module.scss";

type Props = {
  agent: any;
  perspective: any;
  channel: any;
  itemId?: string;
  index?: number;
  selectedTopic?: string;
  match?: boolean;
  totalMatches: number;
  scrollToTimeline: (index: number) => void;
  synergize: (item: any, topic: string) => void;
  allTopics: any[];
  getAllTopics: () => void;
};

export default function Timeline({
  agent,
  perspective,
  channel,
  itemId,
  index,
  selectedTopic,
  totalMatches,
  scrollToTimeline,
  synergize,
  allTopics,
  getAllTopics,
}: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<any>(itemId || null);
  const [unprocessedItems, setUnprocessedItems] = useState(false);
  const [processing, setProcessing] = useState(false);
  const id = channel?.id || channel;

  const { entries: messages } = useSubjects({
    perspective,
    source: id,
    subject: Message,
  });
  const { entries: posts } = useSubjects({
    perspective,
    source: id,
    subject: Post,
  });
  const { entries: tasks } = useSubjects({
    perspective,
    source: id,
    subject: "Task",
  });

  function matchText() {
    if (!totalMatches) return "";
    if (index === 0)
      return `${totalMatches} match${totalMatches > 1 ? "es" : ""}`;
    if (totalMatches > index)
      return `${totalMatches - index} more match${totalMatches - index > 1 ? "es" : ""}`;
  }

  async function process() {
    setProcessing(true);
    Promise.all(items.map((item) => processItem(perspective, allTopics, item)))
      .then(() => {
        getAllTopics();
        setProcessing(false);
      })
      .catch(console.log);
  }

  // aggregate all items into array and sort by date
  useEffect(() => {
    const newItems = [
      ...messages.map((message) => transformItem(id, "Message", message)),
      ...posts.map((post) => transformItem(id, "Post", post)),
      ...tasks.map((task) => transformItem(id, "Task", task)),
    ].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    // compare previous and new items before updating state to prevent infinite render loop
    setItems((prevItems) => {
      if (!isEqual(prevItems, newItems)) return newItems;
      return prevItems;
    });
  }, [messages, posts, tasks]);

  // scroll to matching item
  useEffect(() => {
    if (selectedItemId && items.length) {
      const item = document.getElementById(`${index}-${selectedItemId}`);
      const timelineItems = document.getElementById(`timeline-items-${index}`);
      timelineItems.scrollBy({
        top: item?.getBoundingClientRect().top - 420,
        behavior: "smooth",
      });
    }
  }, [items, selectedItemId]);

  // check for unprocessed items
  useEffect(() => {
    let match = false;
    Promise.all(
      items.map(
        (item) =>
          new Promise(async (resolve: any) => {
            const relationships = await findRelationships(perspective, item.id);
            if (!relationships.length) match = true;
            resolve();
          })
      )
    )
      .then(() => setUnprocessedItems(match))
      .catch(console.log);
  }, [items, selectedItemId]);

  return (
    <div
      id={`timeline-${index}`}
      className={`${styles.wrapper} ${index > 0 && styles.match}`}
    >
      <div className={styles.header}>
        <j-flex gap="400" a="center">
          <h2>{channel?.name || "This channel"}</h2>
          {index === 0 && unprocessedItems && (
            <j-button
              variant="primary"
              size="sm"
              onClick={process}
              loading={processing}
            >
              Process unprocessed items
            </j-button>
          )}
        </j-flex>
        {window.innerWidth < 1200 || index > 0 ? (
          <j-flex gap="400" a="center">
            {index > (window.innerWidth < 1200 ? 0 : 1) && (
              <j-button
                size="sm"
                circle
                onClick={() => scrollToTimeline(index - 1)}
              >
                <j-icon name="caret-left-fill" />
              </j-button>
            )}
            {index < totalMatches && (
              <j-button
                size="sm"
                circle
                onClick={() => scrollToTimeline(index + 1)}
              >
                <j-icon name="caret-right-fill" />
              </j-button>
            )}
            <j-text
              nomargin
              onClick={() => scrollToTimeline(index + 1)}
              style={{ cursor: "pointer" }}
            >
              {matchText()}
            </j-text>
          </j-flex>
        ) : (
          <j-text nomargin>{matchText()}</j-text>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.fades}>
          <div className={styles.fadeTop} />
          <div className={styles.fadeBottom} />
          <div className={styles.line} />
        </div>
        <div id={`timeline-items-${index}`} className={styles.items}>
          <div className={styles.line} />
          <div style={{ minHeight: "100%" }}>
            {items.map((item) => (
              <TimelineItem
                agent={agent}
                perspective={perspective}
                item={item}
                index={index}
                selectedTopic={selectedTopic}
                selected={item.id === selectedItemId}
                setSelectedItemId={setSelectedItemId}
                synergize={synergize}
              />
            ))}
          </div>
          <div className={styles.line} />
        </div>
      </div>
    </div>
  );
}
