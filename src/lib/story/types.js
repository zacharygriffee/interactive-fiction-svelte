export const EFFECT_TYPES = {
  SET_FLAG: "setFlag",
  INC: "inc",
  PUSH_LOG: "pushLog",
  ADD_KNOWLEDGE: "addKnowledge",
  REMOVE_KNOWLEDGE: "removeKnowledge",
  ADD_ITEM: "addItem",
  REMOVE_ITEM: "removeItem",
  ADJUST_RELATIONSHIP: "adjustRelationship",
  SET_TIMER: "setTimer",
  ADVANCE_TIMER: "advanceTimer",
  SET_SCENE_FLAG: "setSceneFlag"
};

export const CONDITION_TYPES = {
  FLAG_TRUTHY: "flagTruthy",
  FLAG_EQUALS: "flagEquals",
  FLAG_GTE: "flagGte",
  FLAG_LTE: "flagLte",
  CAPABILITY: "capability",
  KNOWLEDGE: "knowledge",
  INVENTORY_HAS: "inventoryHas",
  INVENTORY_GTE: "inventoryGte",
  RELATIONSHIP_GTE: "relationshipGte",
  TIMER_GTE: "timerGte",
  TIMER_LTE: "timerLte",
  SCENE_FLAG_EQUALS: "sceneFlagEquals",
  VISITED_NODE: "visitedNode",
  CHOSE_CHOICE: "choseChoice"
};

export const ACTION_TYPES = {
  ENTER_NODE: "ENTER_NODE",
  CHOOSE: "CHOOSE",
  GO_BACK: "GO_BACK"
};

export const INTERNAL_ACTION_TYPES = {
  REVEAL_STORYLETS: "REVEAL_STORYLETS",
  APPLY_RATIFIED: "APPLY_RATIFIED"
};

export const STATE_VERSION = 3;
