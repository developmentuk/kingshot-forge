import type {
  RecordEditorSchema,
} from "./recordEditorSchema";

export const heroSkillsRecordEditorSchema:
RecordEditorSchema = {
  datasetId: "hero-skills",
  singularLabel: "Hero Skill",
  pluralLabel: "Hero Skills",
  idField: "id",
  titleField: "name",
  allowCreate: true,
  allowDuplicate: false,
  allowDelete: false,

  sections: [
    {
      id: "relationship",
      title: "Hero relationship",
      order: 10,
    },
    {
      id: "identity",
      title: "Skill identity",
      order: 20,
    },
    {
      id: "content",
      title: "Skill content",
      order: 30,
    },
    {
      id: "presentation",
      title: "Presentation",
      order: 40,
    },
    {
      id: "provenance",
      title: "Source and verification",
      order: 50,
    },
    {
      id: "system",
      title: "System metadata",
      order: 60,
      collapsedByDefault: true,
    },
  ],

  fields: [
    {
      key: "hero_slug",
      label: "Hero slug",
      type: "text",
      section: "relationship",
      order: 10,
      required: true,
      description:
        "Stable slug of the canonical Hero this skill belongs to.",
      validation: {
        required: true,
        pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        message: "Use a lowercase kebab-case Hero slug.",
      },
    },
    {
      key: "hero_name",
      label: "Hero name",
      type: "readonly",
      section: "relationship",
      order: 20,
      readOnly: true,
      description:
        "Resolved from the published Hero catalogue after publication.",
    },
    {
      key: "name",
      label: "Skill name",
      type: "text",
      section: "identity",
      order: 10,
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 120,
      },
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      section: "identity",
      order: 20,
      required: true,
      options: [
        { label: "Conquest", value: "conquest" },
        { label: "Expedition", value: "expedition" },
        { label: "Talent", value: "talent" },
        { label: "Exclusive gear", value: "exclusive_gear" },
      ],
      validation: {
        required: true,
      },
    },
    {
      key: "skill_type",
      label: "Skill type",
      type: "text",
      section: "identity",
      order: 30,
      description:
        "Optional verified type, such as active, passive or trigger-based.",
      validation: {
        maxLength: 80,
      },
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      section: "content",
      order: 10,
      validation: {
        maxLength: 4000,
      },
    },
    {
      key: "slot_index",
      label: "Skill slot",
      type: "number",
      section: "presentation",
      order: 10,
      required: true,
      validation: {
        required: true,
        integer: true,
        min: 1,
        max: 20,
      },
    },
    {
      key: "display_order",
      label: "Display order",
      type: "number",
      section: "presentation",
      order: 20,
      required: true,
      validation: {
        required: true,
        integer: true,
        min: 1,
        max: 100,
      },
    },
    {
      key: "max_level",
      label: "Maximum level",
      type: "number",
      section: "presentation",
      order: 30,
      required: true,
      validation: {
        required: true,
        integer: true,
        min: 1,
        max: 100,
      },
    },
    {
      key: "icon_url",
      label: "Icon URL",
      type: "url",
      section: "presentation",
      order: 40,
    },
    {
      key: "is_active",
      label: "Published active state",
      type: "boolean",
      section: "presentation",
      order: 50,
      required: true,
      description:
        "Inactive skills remain in history but are excluded from the public Companion.",
    },
    {
      key: "source_name",
      label: "Source name",
      type: "text",
      section: "provenance",
      order: 10,
      validation: {
        maxLength: 200,
      },
    },
    {
      key: "source_url",
      label: "Source URL",
      type: "url",
      section: "provenance",
      order: 20,
    },
    {
      key: "source_verified",
      label: "Verification note",
      type: "text",
      section: "provenance",
      order: 30,
      validation: {
        maxLength: 200,
      },
    },
    {
      key: "source_updated_at",
      label: "Source updated date",
      type: "text",
      section: "provenance",
      order: 40,
      placeholder: "YYYY-MM-DD",
      validation: {
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        message: "Use the date format YYYY-MM-DD.",
      },
    },
    {
      key: "source_accuracy_score",
      label: "Accuracy score",
      type: "number",
      section: "provenance",
      order: 50,
      validation: {
        integer: true,
        min: 0,
        max: 100,
      },
    },
    {
      key: "id",
      label: "Record ID",
      type: "readonly",
      section: "system",
      order: 10,
      readOnly: true,
      description:
        "Stable editorial key generated when the draft is created.",
    },
    {
      key: "hero_id",
      label: "Hero ID",
      type: "readonly",
      section: "system",
      order: 20,
      readOnly: true,
    },
    {
      key: "created_at",
      label: "Created",
      type: "readonly",
      section: "system",
      order: 30,
      readOnly: true,
    },
    {
      key: "updated_at",
      label: "Updated",
      type: "readonly",
      section: "system",
      order: 40,
      readOnly: true,
    },
  ],

  createEmptyRecord: () => {
    const id = `new-hero-skill-${Date.now().toString(36)}`;

    return {
      id,
      values: {
        id,
        hero_id: null,
        hero_slug: "",
        hero_name: null,
        name: "",
        category: "conquest",
        skill_type: null,
        description: null,
        icon_url: null,
        display_order: 1,
        slot_index: 1,
        max_level: 5,
        is_active: true,
        source_updated_at: null,
        source_verified: null,
        source_accuracy_score: null,
        source_name: null,
        source_url: null,
        created_at: null,
        updated_at: null,
      },
    };
  },
};
