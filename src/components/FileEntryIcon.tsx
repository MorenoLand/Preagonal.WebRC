import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import type { ApiFileEntry } from '../api/gameServerApi';
import archiveIcon from '../../images/rcfiles_archive.png';
import binaryIcon from '../../images/rcfiles_binary.png';
import configIcon from '../../images/rcfiles_conf.png';
import gmapIcon from '../../images/rcfiles_gmap.png';
import graalIcon from '../../images/rcfiles_graal.png';
import nwIcon from '../../images/rcfiles_nw.png';
import textIcon from '../../images/rcfiles_text2.png';
import ttfIcon from '../../images/rcfiles_ttf.png';
import unknownIcon from '../../images/rcfiles_unknown.png';

type FileIconKind = 'archive' | 'binary' | 'config' | 'font' | 'gmap' | 'graal' | 'nw' | 'text' | 'unknown';

const fileIcons: Record<FileIconKind, string> = { archive: archiveIcon, binary: binaryIcon, config: configIcon, font: ttfIcon, gmap: gmapIcon, graal: graalIcon, nw: nwIcon, text: textIcon, unknown: unknownIcon };

function getFileIconKind(entry: ApiFileEntry): FileIconKind {
  const path = (entry.path || entry.name).toLowerCase();
  if (path.includes('config') || path.includes('settings') || path.includes('options')) return 'config';
  const extension = path.lastIndexOf('.') === -1 ? '' : path.slice(path.lastIndexOf('.'));
  if (extension === '.bin' || extension === '.gs2bc') return 'binary';
  if (extension === '.txt') return 'text';
  if (extension === '.ttf' || extension === '.otf') return 'font';
  if (extension === '.tar' || extension === '.zip' || extension === '.rar' || extension === '.7z') return 'archive';
  if (extension === '.conf') return 'config';
  if (extension === '.gmap') return 'gmap';
  if (extension === '.graal') return 'graal';
  if (extension === '.nw') return 'nw';
  return 'unknown';
}

export function FileEntryIcon({ entry }: { entry: ApiFileEntry }) {
  if (entry.isDirectory) return <span className="file-entry-icon directory" data-testid={`file-entry-icon-${entry.name}`} aria-hidden="true"><FolderOutlinedIcon /></span>;
  return <span className="file-entry-icon file" data-testid={`file-entry-icon-${entry.name}`} aria-hidden="true"><img src={fileIcons[getFileIconKind(entry)]} alt="" draggable={false} /></span>;
}
