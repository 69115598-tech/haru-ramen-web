// เชื่อมแอปเข้ากับ Supabase (ฐานข้อมูล + รูปภาพ + ดาวน์โหลด QR)
(function () {
  var C = window.HARU_CONFIG || {};
  var ok = C.SUPABASE_URL && C.SUPABASE_ANON_KEY && C.SUPABASE_URL.indexOf("YOUR") < 0 && window.supabase;
  var sb = ok ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;

  function coll(c) {
    return {
      doc: function (id) {
        return {
          set: function (data) {
            return sb.from("kv").upsert({ col: c, id: id, data: data, updated_at: new Date().toISOString() })
              .then(function (r) { if (r.error) throw r.error; return r; });
          },
          delete: function () {
            return sb.from("kv").delete().eq("col", c).eq("id", id)
              .then(function (r) { if (r.error) throw r.error; return r; });
          }
        };
      },
      onSnapshot: function (cb, err) {
        var rows = {};
        function emit() {
          cb({ docs: Object.keys(rows).map(function (k) { return { id: k, data: function () { return rows[k]; } }; }) });
        }
        sb.from("kv").select("id,data").eq("col", c).then(function (r) {
          if (r.error) { if (err) err(r.error); return; }
          r.data.forEach(function (x) { rows[x.id] = x.data; });
          emit();
        });
        sb.channel("kv-" + c)
          .on("postgres_changes", { event: "*", schema: "public", table: "kv", filter: "col=eq." + c }, function (p) {
            if (p.eventType === "DELETE") { delete rows[p.old.id]; } else { rows[p.new.id] = p.new.data; }
            emit();
          }).subscribe();
      }
    };
  }

  var db = ok ? { collection: coll } : null;
  var assets = ok ? {
    upload: function (f) {
      var p = Date.now() + "-" + f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      return sb.storage.from("menu-images").upload(p, f, { contentType: f.type }).then(function (r) {
        if (r.error) throw r.error;
        return { url: sb.storage.from("menu-images").getPublicUrl(p).data.publicUrl };
      });
    }
  } : null;
  var dl = {
    save: function (o) {
      var a = document.createElement("a");
      a.href = o.data; a.download = o.filename;
      document.body.appendChild(a); a.click(); a.remove();
      return Promise.resolve();
    }
  };
  window.claude = { use: function (n) { return Promise.resolve(n === "db" ? db : n === "assets" ? assets : n === "downloads" ? dl : null); } };
  if (!ok) console.warn("ยังไม่ได้ตั้งค่า config.js - ทำงานแบบออฟไลน์ (ข้อมูลไม่ซิงก์ระหว่างเครื่อง)");
})();
