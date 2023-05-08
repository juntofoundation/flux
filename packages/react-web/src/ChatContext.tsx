import React, {
  createContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { Messages, Message, EntryType } from "@fluxapp/types";
import { LinkExpression, Literal } from "@perspect3vism/ad4m";

import {
  getMessage,
  getMessages,
  createMessage,
  subscribeToLinks,
  deleteMessageReaction,
  createMessageReaction,
  createReply,
  hideEmbeds,
  generateReply,
  generateMessage,
  checkUpdateSDNAVersion,
  editCurrentMessage,
  getMe,
  Me,
} from "@fluxapp/api";
import { sdna, community } from "@fluxapp/constants";
import { linkIs, sortExpressionsByTimestamp } from "@fluxapp/utils";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

const { DEFAULT_LIMIT } = sdna;
const { REACTION } = community;

type State = {
  communityId: string;
  channelId: string;
  isFetchingMessages: boolean;
  keyedMessages: Messages;
  hasNewMessage: boolean;
  isMessageFromSelf: boolean;
  showLoadMore: boolean;
};

type ContextProps = {
  state: State;
  methods: {
    loadMore: () => void;
    sendReply: (message: string, replyUrl: string) => void;
    removeReaction: (linkExpression: LinkExpression) => void;
    addReaction: (messageUrl: string, reaction: string) => void;
    sendMessage: (message: string) => void;
    editMessage: (message: string, editedMesage: string) => void;
    setHasNewMessage: (value: boolean) => void;
    setIsMessageFromSelf: (value: boolean) => void;
    hideMessageEmbeds: (messageUrl: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    communityId: "",
    channelId: "",
    isFetchingMessages: false,
    keyedMessages: {},
    hasNewMessage: false,
    isMessageFromSelf: false,
    showLoadMore: true,
  },
  methods: {
    loadMore: () => null,
    sendReply: () => null,
    removeReaction: () => null,
    addReaction: () => null,
    sendMessage: () => null,
    editMessage: () => null,
    setHasNewMessage: () => null,
    setIsMessageFromSelf: () => null,
    hideMessageEmbeds: () => null,
  },
};

const ChatContext = createContext(initialState);

export function ChatProvider({ perspectiveUuid, children, channelId }: any) {
  const linkSubscriberRef = useRef<Function | null>();

  const [state, setState] = useState(initialState.state);

  const [agent, setAgent] = useState<Me>();

  useEffect(() => {
    fetchAgent();
  }, []);

  async function fetchAgent() {
    const agent = await getMe();

    setAgent({ ...agent });
  }

  const messages = useMemo(
    () => sortExpressionsByTimestamp(state.keyedMessages, "asc"),
    [state.keyedMessages]
  );

  useEffect(() => {
    if (perspectiveUuid && channelId && agent) {
      fetchMessages();
    }
  }, [perspectiveUuid, channelId, agent]);

  useEffect(() => {
    if (perspectiveUuid) {
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current && linkSubscriberRef.current();
    };
  }, [perspectiveUuid]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid,
      added: handleLinkAdded,
      removed: handleLinkRemoved,
    });
  }

  function addMessage(oldState, message) {
    const newState = {
      ...oldState,
      hasNewMessage: true,
      keyedMessages: {
        ...oldState.keyedMessages,
        [message.id]: { ...message, isNeighbourhoodCardHidden: false },
      },
    };
    return newState;
  }

  function addEditMessage(oldState, oldMessage, message) {
    const newState = {
      ...oldState,
      hasNewMessage: false,
      keyedMessages: {
        ...oldState.keyedMessages,
        [oldMessage]: {
          ...oldState.keyedMessages[oldMessage],
          editMessages: [
            ...oldState.keyedMessages[oldMessage].editMessages,
            message,
          ],
        },
      },
    };
    return newState;
  }

  function updateMessagePopularStatus(link, status) {
    const id = link.data.source;

    setState((oldState) => {
      const message: Message = oldState.keyedMessages[id];

      if (!message) return oldState;

      return {
        ...oldState,
        keyedMessages: {
          ...oldState.keyedMessages,
          [id]: {
            ...message,
            isPopular: status,
          },
        },
      };
    });
  }

  function addReactionToState(link, synced = false) {
    const id = link.data.source;

    setState((oldState) => {
      const message: Message = oldState.keyedMessages[id];

      if (message) {
        const linkFound = message.reactions.find(
          (e) => e.content === link.data.target && e.author === link.author
        );

        if (linkFound) return oldState;

        return {
          ...oldState,
          keyedMessages: {
            ...oldState.keyedMessages,
            [id]: {
              ...message,
              reactions: [
                ...message.reactions,
                {
                  author: link.author,
                  content: link.data.target.replace("emoji://", ""),
                  timestamp: link.timestamp,
                  synced,
                },
              ],
            },
          },
        };
      }

      return oldState;
    });
  }

  function removeReactionFromState(link) {
    const id = link.data.source;

    setState((oldState) => {
      const message: Message = oldState.keyedMessages[id];

      if (!message) return oldState;

      function filterReactions(reaction, link) {
        const isSameAuthor = reaction.author === link.author;
        const isSameAuthorAndContent =
          isSameAuthor &&
          reaction.content === link.data.target.replace("emoji://", "");
        return isSameAuthorAndContent ? false : true;
      }

      return {
        ...oldState,
        keyedMessages: {
          ...oldState.keyedMessages,
          [id]: {
            ...message,
            reactions: message.reactions.filter((e) =>
              filterReactions(e, link)
            ),
          },
        },
      };
    });
  }

  function findReactionAndSync(link) {
    const id = link.data.source;

    setState((oldState) => {
      const message: Message = oldState.keyedMessages[id];

      if (!message) return oldState;

      function updateReactions(reaction, link) {
        const isSameAuthor = reaction.author === link.author;
        const isSameAuthorAndContent =
          isSameAuthor &&
          reaction.content === link.data.target.replace("emoji://", "");
        return isSameAuthorAndContent
          ? {
              ...reaction,
              timestamp: link.timestamp,
              synced: true,
            }
          : reaction;
      }

      return {
        ...oldState,
        keyedMessages: {
          ...oldState.keyedMessages,
          [id]: {
            ...message,
            reactions: message.reactions.map((e) => updateReactions(e, link)),
          },
        },
      };
    });
  }

  function addHiddenToMessageToState(
    oldState,
    messageId,
    isNeighbourhoodCardHidden
  ) {
    const newState = {
      ...oldState,
      hasNewMessage: false,
      keyedMessages: {
        ...oldState.keyedMessages,
        [messageId]: {
          ...oldState.keyedMessages[messageId],
          isNeighbourhoodCardHidden,
        },
      },
    };
    return newState;
  }

  async function handleLinkAdded(link) {
    const client = await getAd4mClient();

    const agent = await getMe();

    const isMessageFromSelf = link.author === agent.did;

    //const hasFocus = document.hasFocus();

    if (linkIs.socialDNA(link)) {
      console.warn("got new social dna fetching messages again");
      fetchMessages();
      return;
    }
    if (linkIs.reaction(link)) {
      //TODO; this could read if the message is already popular and if so skip this check
      const isPopularPost = await client.perspective.queryProlog(
        perspectiveUuid,
        `isPopular("${link.data.source}").`
      );

      if (isPopularPost) {
        updateMessagePopularStatus(link, true);
      }

      if (
        await client.perspective.queryProlog(
          perspectiveUuid,
          `triple("${channelId}", "${EntryType.Message}", "${link.data.source}").`
        )
      ) {
        if (!isMessageFromSelf) {
          addReactionToState(link, true);
        } else {
          findReactionAndSync(link);
        }
      }

      return;
    }

    const isSimpleChannelNaive = link.data.source === channelId;

    if (linkIs.message(link) && isSimpleChannelNaive) {
      const message = getMessage(link);

      if (message) {
        setState((oldState) =>
          addMessage(oldState, { ...message, synced: true })
        );

        setState((oldState) => ({
          ...oldState,
          isMessageFromSelf,
        }));
        return;
      }
    }

    const isSameChannelExplicit = await client.perspective.queryProlog(
      perspectiveUuid,
      `triple("${channelId}", "${EntryType.Message}", "${link.data.target}").`
    );

    if (linkIs.editedMessage(link) && isSameChannelExplicit) {
      const message = Literal.fromUrl(link.data.target).get();
      setState((oldState) =>
        addEditMessage(oldState, link.data.source, {
          author: link.author,
          content: message.data,
          timestamp: link.timestamp,
        })
      );
      return;
    }

    if (linkIs.reply(link) && isSameChannelExplicit) {
      const message = getMessage(link);

      setState((oldState) =>
        addMessage(oldState, { ...message, synced: true })
      );

      setState((oldState) => ({
        ...oldState,
        isMessageFromSelf,
      }));
      return;
    }

    if (linkIs.hideNeighbourhoodCard(link) && isSameChannelExplicit) {
      const id = link.data.source;

      setState((oldState) => addHiddenToMessageToState(oldState, id, true));
      return;
    }
  }

  async function handleLinkRemoved(link) {
    const client = await getAd4mClient();

    //TODO: link.proof.valid === false when we recive
    // the remove link somehow. Ad4m bug?
    if (link.data.predicate === REACTION) {
      const isPopularPost = await client.perspective.queryProlog(
        perspectiveUuid,
        `isPopular("${link.data.source}").`
      );

      if (!isPopularPost) {
        updateMessagePopularStatus(link, false);
      }
      removeReactionFromState(link);
    }
  }

  async function fetchMessages(from?: Date, backwards?: boolean) {
    setState((oldState) => ({
      ...oldState,
      isFetchingMessages: true,
    }));

    let newMessages;
    let expressionLinkLength;
    try {
      const data = await getMessages({
        perspectiveUuid,
        channelId,
        from: from,
        backwards,
      });
      newMessages = data.keyedMessages;
      expressionLinkLength = data.expressionLinkLength;
    } catch (e) {
      if (e.message.includes("existence_error")) {
        console.error(
          "We dont have the SDNA to make this query, please wait for community to sync"
        );
        await checkUpdateSDNAVersion(perspectiveUuid, new Date());
        throw e;
      } else {
        throw e;
      }
    }

    setState((oldState) => ({
      ...oldState,
      showLoadMore: expressionLinkLength === DEFAULT_LIMIT || backwards,
      isFetchingMessages: false,
      keyedMessages: {
        ...oldState.keyedMessages,
        ...newMessages,
      },
    }));

    return expressionLinkLength;
  }

  function sendMessage(value) {
    generateMessage(value).then((data) => {
      const { message, literal } = data;
      setState((oldState) => addMessage(oldState, message));
      createMessage({
        perspectiveUuid,
        source: channelId,
        message: value,
        literal: literal,
      });
    });
  }

  async function editMessage(message, editedMessage) {
    const res = await editCurrentMessage({
      perspectiveUuid,
      lastMessage: message,
      message: editedMessage,
    });

    setState((oldState) =>
      addEditMessage(oldState, message, {
        author: res.author,
        content: res.content,
        timestamp: res.timestamp,
      })
    );
  }

  async function sendReply(message: string, replyUrl: string) {
    generateReply(message, replyUrl).then((data) => {
      const { message, literal } = data;
      setState((oldState) => addMessage(oldState, message));
      createReply({
        perspectiveUuid,
        message: message,
        replyUrl,
        channelId,
        literal,
      });
    });
  }

  async function hideMessageEmbeds(messageUrl: string) {
    const link = await hideEmbeds({
      perspectiveUuid,
      messageUrl,
    });

    const id = link.data.source;

    setState((oldState) => addHiddenToMessageToState(oldState, id, true));
  }

  async function addReaction(messageUrl: string, reaction: string) {
    addReactionToState({
      author: agent.did,
      data: {
        source: messageUrl,
        target: `emoji://${reaction}`,
        predicate: REACTION,
      },
      timestamp: new Date(),
    });

    await createMessageReaction({
      perspectiveUuid,
      messageUrl,
      reaction,
    });
  }

  function setIsMessageFromSelf(isMessageFromSelf: boolean) {
    setState((oldState) => ({
      ...oldState,
      isMessageFromSelf,
    }));
  }

  async function removeReaction(linkExpression: LinkExpression) {
    await deleteMessageReaction({
      perspectiveUuid,
      linkExpression,
    });

    removeReactionFromState(linkExpression);
  }

  async function loadMore(timestamp: Date, backwards: boolean) {
    console.log("Calling load more");
    if (backwards) {
      return await fetchMessages(new Date(timestamp), backwards);
    } else {
      const oldestMessage = messages[0];

      return await fetchMessages(
        oldestMessage ? new Date(oldestMessage.timestamp) : new Date()
      );
    }
  }

  function setHasNewMessage(value: boolean) {
    setState((oldState) => ({
      ...oldState,
      hasNewMessage: value,
    }));
  }

  return (
    <ChatContext.Provider
      value={{
        state: { ...state, messages, communityId: perspectiveUuid, channelId },
        methods: {
          loadMore,
          sendMessage,
          addReaction,
          sendReply,
          removeReaction,
          setHasNewMessage,
          setIsMessageFromSelf,
          hideMessageEmbeds,
          editMessage,
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;