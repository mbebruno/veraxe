/**
 * Client LinkedIn — UGC Posts API
 *
 * Publie un texte sur le fil LinkedIn d'un utilisateur.
 * Nécessite un token OAuth2 avec scope w_member_social.
 *
 * Si le token n'est pas configuré, retourne le contenu préparé
 * pour publication manuelle.
 */

export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  message: string;
  url?: string;
}

export async function publishPost(content: string): Promise<LinkedInPostResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!token) {
    return {
      success: false,
      message: `Post préparé (non publié — LinkedIn non configuré). Pour publier manuellement:
1. Copie le contenu ci-dessous
2. Colle-le sur LinkedIn
3. Ajoute ton lien GitHub

--- Contenu du post ---
${content}
---`,
    };
  }

  const authorUid = process.env.LINKEDIN_OWNER_UID;
  if (!authorUid) {
    return {
      success: false,
      message: `LINKEDIN_OWNER_UID non défini. Le post ne peut pas être publié automatiquement.

Contenu préparé:
${content}`,
    };
  }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${authorUid}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: { text: content } },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return {
      success: false,
      message: `Erreur LinkedIn API (${res.status}): ${errText}`,
    };
  }

  const data = await res.json();
  const postId = data?.value?.id;
  return {
    success: true,
    postId,
    message: `Post publié avec succès sur LinkedIn!`,
    url: postId ? `https://www.linkedin.com/feed/update/${postId}/` : undefined,
  };
}
