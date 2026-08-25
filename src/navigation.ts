import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

export type NavigationIcon = ComponentType<SvgIconProps>;

export interface NavigationItem {
  id: import('./types').FeatureId;
  label: string;
  description: string;
  icon: NavigationIcon;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Channels',
    items: [
      { id: 'chat', label: 'RC Chat', description: 'Remote-control chat and command output.', icon: ChatBubbleOutlineIcon },
      { id: 'players', label: 'Player List', description: 'Inspect the players visible to the remote control.', icon: PeopleAltOutlinedIcon },
      { id: 'servers', label: 'Servers', description: 'Server selection and live server status.', icon: DnsOutlinedIcon }
    ]
  },
  {
    label: 'Management',
    items: [
      { id: 'files', label: 'File Browser', description: 'Browse and manage files allowed by the account.', icon: FolderOutlinedIcon },
      { id: 'server-options', label: 'Server Options', description: 'Read and update server option source.', icon: SettingsOutlinedIcon },
      { id: 'folder-config', label: 'Folder Config', description: 'Read and update indexed folder configuration.', icon: FolderOpenOutlinedIcon },
      { id: 'server-flags', label: 'Server Flags', description: 'Inspect and update server flags.', icon: FlagOutlinedIcon }
    ]
  },
  {
    label: 'NPC Control',
    items: [
      { id: 'weapons', label: 'Weapons', description: 'Weapon source and live catalog management.', icon: ShieldOutlinedIcon },
      { id: 'npcs', label: 'NPCs', description: 'Database NPC inspection and script management.', icon: SmartToyOutlinedIcon },
      { id: 'classes', label: 'Classes', description: 'Class source and compiled script management.', icon: CodeOutlinedIcon }
    ]
  }
];

export const navigationItems = navigationGroups.flatMap(group => group.items);

export const navigationById = Object.fromEntries(navigationItems.map(item => [item.id, item])) as Record<NavigationItem['id'], NavigationItem>;
