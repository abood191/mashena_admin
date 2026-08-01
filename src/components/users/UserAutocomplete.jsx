import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { userService } from "@/app/services/user.service";

export default function UserAutocomplete({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const debouncedSearch = useDebounce(search, 400);
  const wrapperRef = useRef(null);

  // Fetch users when debounced search changes
  useEffect(() => {
    if (!debouncedSearch) {
      setUsers([]);
      return;
    }
    
    let isMounted = true;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch both drivers and riders to search across all users
        const [driversRes, ridersRes] = await Promise.all([
          userService.getDrivers({ search: debouncedSearch, limit: 5, skip: 0 }),
          userService.getRiders({ search: debouncedSearch, limit: 5, skip: 0 })
        ]);
        
        if (isMounted) {
          const combined = [
            ...(driversRes?.data || []),
            ...(ridersRes?.data || [])
          ];
          setUsers(combined);
        }
      } catch (error) {
        console.error("Failed to fetch users for autocomplete", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchUsers();
    
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // When a value is provided from outside (or cleared)
  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
      setSearch("");
    }
  }, [value]);

  const handleSelect = (user) => {
    setSelectedUser(user);
    setSearch(user.fullName || user.email);
    setIsOpen(false);
    onChange(user.id);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedUser(null);
    setSearch("");
    onChange("");
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground" size={18} />
      
      <input
        type="text"
        placeholder={placeholder || t("common.searchUser", "Search User...")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!isOpen) setIsOpen(true);
          if (selectedUser) {
            setSelectedUser(null);
            onChange("");
          }
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full bg-surface border border-border-subtle rounded-2xl py-3 pl-12 pr-10 text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
      />

      {selectedUser ? (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors"
        >
          <X size={16} />
        </button>
      ) : loading ? (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-subtle border-t-[#4880FF]"></div>
        </div>
      ) : null}

      {isOpen && (search.length > 0 || users.length > 0) && !selectedUser && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
          {loading && users.length === 0 ? (
            <div className="p-4 text-center text-foreground text-sm">{t("common.loading", "Loading...")}</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-foreground text-sm">{t("common.noResults", "No users found")}</div>
          ) : (
            <div className="flex flex-col py-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 text-left transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground flex-shrink-0">
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{user.fullName || "Unknown"}</div>
                    <div className="text-xs text-foreground truncate">{user.email || user.phoneNumber || ""}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
