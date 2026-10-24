import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Group {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  chat_profiles: {
    full_name: string;
    avatar_url: string;
  };
}

type Mode = "chat" | "create";

export default function Chat() {
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>("chat");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");

  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- FETCH USERS ---------------- */
  useEffect(() => {
    supabase
      .from("chat_profiles")
      .select("id, full_name, avatar_url")
      .then(({ data }) => setUsers(data || []));
  }, []);

  /* ---------------- FETCH GROUPS ---------------- */
  useEffect(() => {
    supabase
      .from("groups")
      .select("id, name")
      .then(({ data }) => setGroups(data || []));
  }, []);

  /* ---------------- FETCH MESSAGES ---------------- */
  const fetchMessages = async (groupId: string) => {
    const { data } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        sender_id,
        chat_profiles ( full_name, avatar_url )
      `)
      .eq("group_id", groupId)
      .order("created_at");

    setMessages(data || []);
  };

  useEffect(() => {
    if (!selectedGroup) return;
    fetchMessages(selectedGroup.id);
  }, [selectedGroup]);

  /* ---------------- REALTIME ---------------- */
  useEffect(() => {
    if (!selectedGroup) return;

    const channel = supabase
      .channel(`group-${selectedGroup.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${selectedGroup.id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select(`
              id,
              content,
              sender_id,
              chat_profiles ( full_name, avatar_url )
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGroup]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
    if (!messageInput.trim() || !user || !selectedGroup) return;

    await supabase.from("messages").insert({
      group_id: selectedGroup.id,
      sender_id: user.id,
      content: messageInput,
    });

    setMessageInput("");
    fetchMessages(selectedGroup.id); // safe refresh
  };

  /* ---------------- CREATE GROUP ---------------- */
  const createGroup = async () => {
    if (!groupName || selectedUsers.length === 0) return;

    const { data: group } = await supabase
      .from("groups")
      .insert({ name: groupName })
      .select()
      .single();

    if (!group) return;

    const members = selectedUsers.map((uid) => ({
      group_id: group.id,
      user_id: uid,
    }));

    await supabase.from("group_members").insert(members);

    setGroups((prev) => [...prev, group]);
    setSelectedGroup(group);
    setMode("chat");
    setGroupName("");
    setSelectedUsers([]);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex flex-1 ml-64">
        {/* LEFT PANEL */}
        <div className="w-72 border-r p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Groups
            </h2>
            <Button size="icon" onClick={() => setMode("create")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {groups.map((g) => (
            <Card
              key={g.id}
              className="p-3 cursor-pointer hover:bg-muted"
              onClick={() => {
                setSelectedGroup(g);
                setMode("chat");
              }}
            >
              {g.name}
            </Card>
          ))}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 p-6 flex flex-col">
          {mode === "create" ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Create Group</h2>

              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="mb-4"
              />

              {users.map((u) => (
                <label key={u.id} className="flex gap-3 items-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={() =>
                      setSelectedUsers((prev) =>
                        prev.includes(u.id)
                          ? prev.filter((x) => x !== u.id)
                          : [...prev, u.id]
                      )
                    }
                  />
                  <span>{u.full_name}</span>
                </label>
              ))}

              <Button className="mt-4" onClick={createGroup}>
                Create Group
              </Button>
            </>
          ) : !selectedGroup ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a group
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">
                {selectedGroup.name}
              </h2>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((m) => (
                  <div key={m.id}>
                    <b>{m.chat_profiles?.full_name}</b>: {m.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}