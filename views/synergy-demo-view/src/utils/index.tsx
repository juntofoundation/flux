import { Conversation, ConversationSubgroup, SubjectRepository } from "@coasys/flux-api";
import { findRelationships, findTopics, getSubgroupItems } from "@coasys/flux-utils";

// constants
export const groupingOptions = ["Conversations", "Subgroups", "Items"];
export const itemTypeOptions = ["All Types", "Messages", "Posts", "Tasks"];

// helper functions
export function closeMenu(menuId: string) {
  const menu = document.getElementById(menuId);
  const items = menu?.shadowRoot?.querySelector("details");
  if (items) items.open = false;
}

export async function getConvoData(perspective, channelId, match?, setMatchIndex?) {
  const conversationRepo = await new SubjectRepository(Conversation, {
    perspective,
    source: channelId,
  });
  const conversations = (await conversationRepo.getAllData()) as any;
  return await Promise.all(
    conversations.map(async (conversation, conversationIndex) => {
      if (match && conversation.id === match.id) setMatchIndex(conversationIndex);
      const subgroupRepo = await new SubjectRepository(ConversationSubgroup, {
        perspective,
        source: conversation.id,
      });
      const subgroups = (await subgroupRepo.getAllData()) as any;
      const subgroupsWithData = await Promise.all(
        subgroups.map(async (subgroup, subgroupIndex) => {
          if (match && subgroup.id === match.id) {
            setMatchIndex(conversationIndex);
            conversation.matchIndex = subgroupIndex;
          }
          const subgroupRelationships = await findRelationships(perspective, subgroup.id);
          const subgroupItems = await getSubgroupItems(perspective, subgroup.id);
          subgroup.groupType = "subgroup";
          if (match && subgroup.id === match.id) conversation.matchIndex = conversationIndex;
          subgroup.topics = await findTopics(perspective, subgroupRelationships);
          subgroup.start = subgroupItems[0].timestamp;
          subgroup.end = subgroupItems[subgroupItems.length - 1].timestamp;
          subgroup.participants = [];
          subgroup.children = await Promise.all(
            subgroupItems.map(async (item: any, itemIndex) => {
              const itemRelationships = await findRelationships(perspective, item.id);
              item.groupType = "item";
              if (match && item.id === match.id) {
                setMatchIndex(conversationIndex);
                conversation.matchIndex = subgroupIndex;
                subgroup.matchIndex = itemIndex;
              }
              item.topics = await findTopics(perspective, itemRelationships);
              if (!subgroup.participants.find((p) => p === item.author))
                subgroup.participants.push(item.author);
              return item;
            })
          );
          return subgroup;
        })
      );
      conversation.groupType = "conversation";
      conversation.participants = [];
      subgroupsWithData.forEach((subgroup) => {
        subgroup.participants.forEach((p) => {
          if (!conversation.participants.includes(p)) conversation.participants.push(p);
        });
      });
      const conversationRelationships = await findRelationships(perspective, conversation.id);
      conversation.topics = await findTopics(perspective, conversationRelationships);
      conversation.children = subgroupsWithData;
      return conversation;
    })
  );
}

// svgs
export function ChevronUpSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        fill="currentColor"
        d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"
      />
    </svg>
  );
}

export function ChevronDownSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        fill="currentColor"
        d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
      />
    </svg>
  );
}

export function ChevronRightSVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
      <path
        fill="currentColor"
        d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
      />
    </svg>
  );
}

export function CurveSVG() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="38"
      height="60"
      version="1.1"
      viewBox="0 0 10.054 15.875"
    >
      <g transform="translate(-3.39 -5.533)">
        <path
          fill="none"
          stroke="currentColor"
          strokeDasharray="none"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit="4"
          strokeOpacity="1"
          strokeWidth="1.587"
          d="M4.185 5.533c0 10.349 8.466 4.714 8.466 15.876"
        />
      </g>
    </svg>
  );
}