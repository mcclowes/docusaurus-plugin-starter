/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
module.exports = {
  tutorialSidebar: [
    { type: 'doc', id: 'intro', label: 'Introduction' },
    { type: 'doc', id: 'auto-link', label: 'Remark Plugin' },
    { type: 'doc', id: 'manual-link', label: 'Using Global Data' },
    { type: 'doc', id: 'graph-config', label: 'Graph Configuration' },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        { type: 'doc', id: 'advanced/features', label: 'Features' },
        { type: 'doc', id: 'advanced/customization', label: 'Customization' },
      ],
    },
  ],
};
