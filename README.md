# ImmortalWrt extra packages

Clone this repository and initialize submodules at the latest commit of their
configured branches:

```sh
git clone --recurse-submodules --remote-submodules <repository-url>
```

Update all submodules to the latest commit later:

```sh
./update-submodules.sh
```

OpenClash tracks its upstream `master` branch. Git still records the resolved
submodule commit in this repository so builds can be reproduced.
