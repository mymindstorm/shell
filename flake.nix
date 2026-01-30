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
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
      ];

      forAllSystems =
        function:
        nixpkgs.lib.genAttrs supportedSystems (
          system:
          function (
            import nixpkgs {
              inherit system;
              overlays = [
                (final: prev: {
                  ags = ags.packages.${system};
                })
              ];
            }
          )
        );
    in
    {
      packages = forAllSystems (
        pkgs:
        let
          pname = "brendan-shell";
          entry = "app.tsx";

          # Since we added the overlay above, we can access ags from pkgs
          astalPackages = with pkgs.ags; [
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
          default = pkgs.buildNpmPackage {
            name = pname;
            src = ./.;

            # Use the newer npmConfigHook if possible, or just standard npmDeps
            npmDeps = pkgs.importNpmLock {
              npmRoot = ./.;
            };
            npmConfigHook = pkgs.importNpmLock.npmConfigHook;

            nativeBuildInputs = with pkgs; [
              wrapGAppsHook3
              gobject-introspection
              # ags executable is now in pkgs thanks to overlay
              pkgs.ags.default
            ];

            buildInputs = extraPackages ++ [ pkgs.gjs ];

            dontNpmBuild = true;

            installPhase = ''
              runHook preInstall

              mkdir -p $out/bin
              mkdir -p $out/share
              cp -r * $out/share

              # 'ags bundle' needs the ags binary
              ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

              runHook postInstall
            '';
          };
        }
      );

      # 4. DevShells for all systems
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          # Use the ags package from the overlay, overriding its extraPackages
          buildInputs = [
            (pkgs.ags.default.override {
              extraPackages =
                with pkgs.ags;
                [
                  io
                  astal4
                  mpris
                  bluetooth
                  network
                  battery
                ]
                ++ [
                  pkgs.libadwaita
                  pkgs.libsoup_3
                ];
            })
          ];
        };
      });

      # 5. Home Manager Module (System Agnostic)
      homeManagerModules.default =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          inherit (lib)
            mkEnableOption
            mkOption
            types
            literalExpression
            mkIf
            ;
          cfg = config.services.brendan-shell;

          sys = pkgs.stdenv.hostPlatform.system;
        in
        {
          options.services.brendan-shell = {
            enable = mkEnableOption "Brendan's Shell";

            package = mkOption {
              type = types.package;
              # Fix: Use the computed 'sys' variable
              default = self.packages.${sys}.default;
              defaultText = literalExpression "inputs.brendan-shell.packages.${sys}.default";
              description = "The brendan-shell package to use.";
            };

            target = mkOption {
              type = types.str;
              default = "graphical-session.target";
              example = "hyprland-session.target";
              description = "The systemd target that will automatically start the shell service.";
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
    };
}
