-- Release 0.7.5 trust model: a verified link means the authenticated user
-- linked a Player ID that Forge successfully resolved through the Kingshot
-- player service. This is not official account authentication or cryptographic
-- proof of exclusive game-account ownership.

alter type public.player_verification_status
  add value if not exists 'verified';

alter type public.player_verification_method
  add value if not exists 'kingshot_player_lookup';
