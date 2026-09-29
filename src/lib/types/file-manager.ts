export interface GridFile {
  id: string;
  file_name: string;
  size_bytes: number;
  imported_at: string;
  web_view_link: string;
}

export interface AdminFile extends GridFile {
  deleted_at: string | null;
}
