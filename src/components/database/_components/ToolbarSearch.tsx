import { IconButton, TextField, InputAdornment } from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

interface ToolbarSearchProps {
  showSearch: boolean;
  searchQuery: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onToggleSearch: () => void;
  onSearchChange: (v: string) => void;
  onCloseSearch: () => void;
}

export default function ToolbarSearch({
  showSearch,
  searchQuery,
  searchInputRef,
  onToggleSearch,
  onSearchChange,
  onCloseSearch,
}: ToolbarSearchProps) {
  return (
    <>
      <IconButton
        size="small"
        aria-label="Search"
        onClick={onToggleSearch}
        sx={{ p: 0.5 }}
      >
        <SearchIcon sx={{ fontSize: 16 }} />
      </IconButton>
      {showSearch && (
        <TextField
          inputRef={searchInputRef}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          size="small"
          variant="outlined"
          sx={{
            width: { xs: 120, sm: 180 },
            "& .MuiOutlinedInput-root": { height: 28, fontSize: "13px" },
            "& .MuiOutlinedInput-input": { py: 0.25, px: 1 },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Close search"
                  onClick={onCloseSearch}
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      )}
    </>
  );
}
