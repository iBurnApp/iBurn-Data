// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "iBurnData",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "iBurn2026APIData",
            targets: ["iBurn2026APIData"]
        ),
        .library(
            name: "iBurn2026Map",
            targets: ["iBurn2026Map"]
        ),
        .library(
            name: "iBurn2026MediaFiles",
            targets: ["iBurn2026MediaFiles"]
        ),
    ],
    dependencies: [
        // No external dependencies - pure resource bundle package
    ],
    targets: [
        .target(
            name: "iBurn2026APIData",
            dependencies: [],
            path: "data/2026/APIData",
            resources: [
                .copy("APIData.bundle")
            ]
        ),
        .target(
            name: "iBurn2026Map",
            dependencies: [],
            path: "data/2026/Map",
            resources: [
                .copy("Map.bundle")
            ]
        ),
        .target(
            name: "iBurn2026MediaFiles",
            dependencies: [],
            path: "data/2026/MediaFiles",
            resources: [
                .copy("MediaFiles.bundle")
            ]
        ),
        .testTarget(
            name: "iBurn2026APIDataTests",
            dependencies: ["iBurn2026APIData"]
        ),
        .testTarget(
            name: "iBurn2026MapTests",
            dependencies: ["iBurn2026Map"]
        ),
        .testTarget(
            name: "iBurn2026MediaFilesTests",
            dependencies: ["iBurn2026MediaFiles"]
        ),
    ]
)
