{
  description = "Brendan's Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      ags,
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      pname = "brendan-shell";
      entry = "app.ts";

      astalPackages = with ags.packages.${system}; [
        io
        astal4
        mpris
        bluetooth
        network
        battery
      ];

      extraPackages = astalPackages ++ [
        pkgs.libadwaita
        pkgs.libsoup_3
      ];
    in
    {
      packages.${system} = {
        default = pkgs.stdenv.mkDerivation {
          name = pname;
          src = ./.;

          nativeBuildInputs = with pkgs; [
            wrapGAppsHook3
            gobject-introspection
            ags.packages.${system}.default
          ];

          buildInputs = extraPackages ++ [ pkgs.gjs ];

          installPhase = ''
            runHook preInstall

            mkdir -p $out/bin
            mkdir -p $out/share
            cp -r * $out/share
            ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

            runHook postInstall
          '';
        };
      };

      homeManagerModules.default =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          inherit (lib.options) mkEnableOption mkOption;
          inherit (lib.modules) mkIf;
          inherit (lib) types literalExpression;

          cfg = config.services.brendan-shell;
        in
        {
          options.services.brendan-shell = {
            enable = mkEnableOption "Brendan's Shell";

            package = mkOption {
              type = types.package;
              default = self.packages.${pkgs.system}.default;
              defaultText = literalExpression "inputs.brendan-shell.packages.\${pkgs.system}.default";
              description = "The brendan-shell package to use.";
            };

            target = mkOption {
              type = types.str;
              default = "graphical-session.target";
              example = "hyprland-session.target";
              description = ''
                The systemd target that will automatically start the shell service.
              '';
            };
          };

          config = mkIf cfg.enable {
            home.packages = [ cfg.package ];

            systemd.user.services.brendan-shell = {
              Unit = {
                Description = "Brendan's Shell";
                PartOf = [ cfg.target ];
                After = [ cfg.target ];
                ConditionEnvironment = "WAYLAND_DISPLAY";
              };

              Service = {
                ExecStart = "${cfg.package}/bin/brendan-shell";
                Restart = "on-failure";
              };

              Install.WantedBy = [ cfg.target ];
            };
          };
        };

      devShells.${system} = {
        default = pkgs.mkShell {
          buildInputs = [
            (ags.packages.${system}.default.override {
              inherit extraPackages;
            })
          ];
        };
      };
    };
}
